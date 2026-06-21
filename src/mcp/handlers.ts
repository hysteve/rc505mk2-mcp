/**
 * MCP tool handler implementations for the device server.
 *
 * Handles:
 * - Reference lookups: list_fx_types, lookup_fx_params
 * - Device operations: detect_device, upload_memory, parse_memory, eject_device
 *
 * Preset CRUD tools — Phase 1 (docs/UNIFIED_MCP_TOOLS.md).
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { detectDevice } from '../device/detect.js';
import { uploadToDevice, checkDeviceSlot } from '../device/upload.js';
import { ejectDevice } from '../device/eject.js';
import { DEVICE_DATA_DIR } from '../device/constants.js';
import { RC0_FX_NAME_LIST, SPECIAL_TRACK_FX, RC0_SEQ_FX_MAP } from '../fx/fx-names.js';
import { PARAM_MAP, SEQ_TARGETS } from '../params/param-map.js';
import { EFFECT_NAME_MAP } from '../params/effect-map.js';
import { memoryConfigToRc0Pair } from '../generator/rc0-generator.js';
import { parseRC0, parseRC0PairActive } from '../parser/rc0-parser.js';
import { getDefaultTemplate } from '../template/template-loader.js';
import { mergeMemoryConfigs } from '../config/merge.js';
import { TRANSFORM_META } from './transform-meta.js';
import { readDeviceSlot, listDeviceSlots } from '../device/read.js';
import {
  validateInput,
  UploadMemoryInputSchema,
  ReadDeviceSlotInputSchema,
  ListDeviceSlotsInputSchema,
} from './input-schemas.js';
import { resolveMemoryConfigFromRack } from './handlers-preset.js';

// ── Reference Handlers ───────────────────────────────────────────

export function handleListFxTypes(args: { context?: 'ifx' | 'tfx' }): object {
  const fxList = RC0_FX_NAME_LIST.map(name => {
    const params = PARAM_MAP[name];
    const isSpecial = SPECIAL_TRACK_FX.has(name);

    if (args.context === 'ifx' && isSpecial) return null;

    const paramNames = params ? Object.keys(params) : [];
    const seqFxName = RC0_SEQ_FX_MAP[name];
    const seqTargets = seqFxName ? (SEQ_TARGETS[seqFxName] || []) : null;

    return {
      name,
      params: paramNames,
      trackFxOnly: isSpecial,
      sequencer: seqTargets
        ? {
            available: true,
            targets: seqTargets,
          }
        : null,
    };
  }).filter(Boolean);

  return {
    fx_types: fxList,
    count: fxList.length,
    sequencerNote:
      'FX with sequencer.available=true support a 16-step sequencer. ' +
      'The sequencer modulates one of the listed target parameters. ' +
      'Use lookup_fx_params to get detailed target value types and sequencer control params.',
  };
}

export function handleLookupFxParams(args: { fx_name: string }): object {
  const name = args.fx_name.toUpperCase();
  const resolved = EFFECT_NAME_MAP[name] || name;
  const params = PARAM_MAP[resolved];

  if (!params) {
    return { error: `Unknown FX type: ${args.fx_name}. Use list_fx_types to see available types.` };
  }

  const paramList = Object.entries(params).map(([paramName, def]) => {
    const meta = TRANSFORM_META.get(def.transform);
    return {
      name: paramName,
      tag: def.tag,
      ...(meta ?? { type: 'numeric', range: { min: 0, max: 100 } }),
    };
  });

  // Build structured sequencer info if this FX supports sequencing
  const seqFxName = RC0_SEQ_FX_MAP[resolved];
  let sequencer = null;

  if (seqFxName) {
    const targetParamNames = SEQ_TARGETS[seqFxName] || [];

    const targets = targetParamNames.map((targetParam, index) => {
      const mainParamDef = params[targetParam];
      const meta = mainParamDef
        ? TRANSFORM_META.get(mainParamDef.transform)
        : null;
      return {
        index,
        param: targetParam,
        stepValueType: meta ?? { type: 'numeric', range: { min: 0, max: 100 } },
      };
    });

    const seqDefs = PARAM_MAP[seqFxName];
    const controlParams = seqDefs
      ? Object.entries(seqDefs)
          .filter(([n]) => !n.startsWith('STEP ') && n !== 'TARGET')
          .map(([paramName, def]) => {
            const meta = TRANSFORM_META.get(def.transform);
            return {
              name: paramName,
              ...(meta ?? { type: 'numeric', range: { min: 0, max: 100 } }),
            };
          })
      : [];

    const targetRangeSummary = targets.map(t => {
      const sv = t.stepValueType;
      const range = sv.type === 'numeric'
        ? `${sv.range.min} to ${sv.range.max}`
        : sv.values.join(', ');
      return `TARGET ${t.index} (${t.param}): step values are ${range}${sv.description ? ` — ${sv.description}` : ''}`;
    }).join('. ');

    sequencer = {
      available: true,
      description:
        'FX sequencer modulates a target parameter across 16 steps. ' +
        'TARGET selects which parameter to modulate (0-indexed). ' +
        `This FX has ${targets.length} sequenceable parameter${targets.length > 1 ? 's' : ''}.\n` +
        'IMPORTANT: Each STEP 1-16 value MUST use the value range of the selected TARGET parameter — NOT 0-100 unless the target range is 0-100. ' +
        `Resolved ranges: ${targetRangeSummary}.`,
      targets,
      controlParams,
      stepCount: 16,
      stepParamNames: Array.from({ length: 16 }, (_, i) => `STEP ${i + 1}`),
    };
  }

  return {
    fx_name: resolved,
    params: paramList,
    isSpecialTrackFx: SPECIAL_TRACK_FX.has(resolved),
    sequencer,
  };
}

// ── Device Handlers ──────────────────────────────────────────────

export function handleParseMemory(args: { xml: string; slot_number: number }): object {
  const config = parseRC0(args.xml, args.slot_number);
  return { config };
}

export function handleDetectDevice(): object {
  const device = detectDevice();
  if (!device) {
    return {
      mounted: false,
      message:
        'RC-505mk2 not detected. Connect the device via USB and enable Storage mode ' +
        '(MENU > USB > STORAGE > CONNECT).',
    };
  }

  return {
    mounted: true,
    path: device.path,
    volume_name: device.volumeName,
    data_dir: join(device.path, DEVICE_DATA_DIR),
  };
}

export function handleUploadMemory(args: Record<string, unknown>): object {
  const v = validateInput(UploadMemoryInputSchema, args);
  if (!v.success) return { error: v.error };
  const mode = v.data.mode ?? 'merge';

  let config = v.data.config;
  if (v.data.rack_id) {
    const resolved = resolveMemoryConfigFromRack(
      v.data.rack_id,
      v.data.slot_number!,
      v.data.name,
    );
    if ('error' in resolved) return { error: resolved.error };
    config = resolved.config;
  }

  if (!config) {
    return { error: 'Provide config or rack_id with slot_number.' };
  }

  // Resolve device
  const device = v.data.device_path
    ? { path: v.data.device_path, volumeName: v.data.device_path }
    : detectDevice();

  if (!device) {
    return {
      error:
        'RC-505mk2 not detected. Connect the device via USB and enable Storage mode ' +
        '(MENU > USB > STORAGE > CONNECT). Or provide device_path explicitly.',
    };
  }

  try {
    const dataPath = join(device.path, DEVICE_DATA_DIR);
    const slotInfo = checkDeviceSlot(dataPath, config.slotNumber);

    // Merge with existing device data when in merge mode
    let finalConfig = config;
    let merged = false;

    if (mode === 'merge' && slotInfo.exists) {
      const existingA = existsSync(slotInfo.fileA)
        ? readFileSync(slotInfo.fileA, 'utf-8')
        : null;
      const existingB = existsSync(slotInfo.fileB)
        ? readFileSync(slotInfo.fileB, 'utf-8')
        : null;

      if (existingA && existingB) {
        const existingConfig = parseRC0PairActive(existingA, existingB, config.slotNumber);
        finalConfig = mergeMemoryConfigs(existingConfig, config);
        merged = true;
      } else if (existingA) {
        const existingConfig = parseRC0(existingA, config.slotNumber);
        finalConfig = mergeMemoryConfigs(existingConfig, config);
        merged = true;
      }
    }

    // Generate the RC0 files from the (possibly merged) config
    const template = getDefaultTemplate();
    const { xmlA, xmlB } = memoryConfigToRc0Pair(template, finalConfig);

    // Perform upload
    const result = uploadToDevice(xmlA, xmlB, finalConfig.slotNumber, {
      devicePath: v.data.device_path,
      backupDir: v.data.backup_dir,
      skipBackup: v.data.skip_backup,
    });

    // Eject the device only when explicitly requested (eject_after: true).
    // Defaults to false so batch uploads can write multiple slots without reconnecting.
    const shouldEject = v.data.eject_after === true;
    const ejectResult = shouldEject
      ? ejectDevice(result.devicePath)
      : { ejected: false, message: 'Device not ejected. Call eject_device when done.' };

    const uploadMsg = merged
      ? `Preset "${finalConfig.name}" merged and uploaded to slot ${result.slot} on ${result.volumeName}. Existing settings preserved for unchanged banks/sections.`
      : `Preset "${finalConfig.name}" uploaded to slot ${result.slot} on ${result.volumeName}.` +
        (result.backedUp ? ' Previous files backed up.' : '');

    return {
      slot_number: result.slot,
      name: finalConfig.name,
      device_path: result.devicePath,
      volume_name: result.volumeName,
      mode,
      merged,
      overwritten: slotInfo.exists,
      backed_up: result.backedUp
        ? { file_a: result.backedUp.fileA, file_b: result.backedUp.fileB }
        : null,
      uploaded: { file_a: result.uploaded.fileA, file_b: result.uploaded.fileB },
      ejected: ejectResult.ejected,
      config: finalConfig,
      message: `${uploadMsg} ${ejectResult.message}`,
    };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export function handleReadDeviceSlot(args: Record<string, unknown>): object {
  const v = validateInput(ReadDeviceSlotInputSchema, args);
  if (!v.success) return { error: v.error };

  const device = v.data.device_path
    ? { path: v.data.device_path, volumeName: v.data.device_path }
    : detectDevice();

  if (!device) {
    return {
      error:
        'RC-505mk2 not detected. Connect the device via USB and enable Storage mode ' +
        '(MENU > USB > STORAGE > CONNECT). Or provide device_path explicitly.',
    };
  }

  try {
    const read = readDeviceSlot(device.path, v.data.slot_number);
    return {
      config: read.config,
      slot_number: read.slot_number,
      name: read.name,
      active_side: read.active_side,
      device_path: read.device_path,
      data_dir: read.data_dir,
      files: read.files,
      message: `Read memory slot ${read.slot_number} "${read.name}" from device (active side: ${read.active_side}).`,
    };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export function handleListDeviceSlots(args: Record<string, unknown>): object {
  const v = validateInput(ListDeviceSlotsInputSchema, args ?? {});
  if (!v.success) return { error: v.error };

  const device = v.data.device_path
    ? { path: v.data.device_path, volumeName: v.data.device_path }
    : detectDevice();

  if (!device) {
    return {
      error:
        'RC-505mk2 not detected. Connect the device via USB and enable Storage mode ' +
        '(MENU > USB > STORAGE > CONNECT). Or provide device_path explicitly.',
    };
  }

  try {
    const slots = listDeviceSlots(device.path);
    return {
      device_path: device.path,
      slots: slots.map(s => ({
        slot_number: s.slot_number,
        name: s.name,
        occupied: s.occupied,
        has_a: s.has_a,
        has_b: s.has_b,
      })),
      count: slots.length,
    };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export function handleEjectDevice(args: { device_path?: string }): object {
  // Resolve device
  const device = args.device_path
    ? { path: args.device_path, volumeName: args.device_path }
    : detectDevice();

  if (!device) {
    return {
      error:
        'RC-505mk2 not detected. Connect the device via USB and enable Storage mode ' +
        '(MENU > USB > STORAGE > CONNECT). Or provide device_path explicitly.',
    };
  }

  const result = ejectDevice(device.path);
  return {
    ejected: result.ejected,
    device_path: device.path,
    message: result.message,
  };
}
