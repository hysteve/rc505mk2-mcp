/**
 * MCP handlers for share export/import and RC0 ZIP packages.
 */

import { detectDevice } from '../device/detect.js';
import { readDeviceSlot } from '../device/read.js';
import { getDefaultTemplate } from '../template/template-loader.js';
import { rackToMemoryConfig } from '../generator/rc0-generator.js';
import type { MemoryConfig } from '../schemas/memory-config.js';
import type { ShareEnvelope, ShareKind } from '../share/envelope.js';
import { parseShareEnvelope, parseShareEnvelopeJson } from '../share/envelope.js';
import {
  extractFxModuleFromMemory,
  extractRackFromMemory,
  fxModuleToShare,
  memoryConfigToShare,
  rackToShare,
} from '../share/extract.js';
import { writeBinaryExport, writeShareJson } from '../share/export-write.js';
import {
  base64ToZip,
  generateMemoryZipFromConfig,
  importMemoryZip,
  zipToBase64,
} from '../share/zip.js';
import { slugifyId } from '../stores/paths.js';
import {
  validateInput,
  ExportShareInputSchema,
  ImportShareInputSchema,
  ExportZipInputSchema,
  ImportZipInputSchema,
} from './input-schemas.js';
import { getPresetStore } from './handlers-preset.js';

function resolveDevicePath(devicePath?: string): { path: string } | { error: string } {
  if (devicePath) return { path: devicePath };
  const device = detectDevice();
  if (!device) {
    return {
      error:
        'RC-505mk2 not detected. Connect the device via USB and enable Storage mode ' +
        '(MENU > USB > STORAGE > CONNECT). Or provide device_path explicitly.',
    };
  }
  return { path: device.path };
}

function buildEnvelopeFromArgs(
  kind: ShareKind,
  args: {
    config?: MemoryConfig;
    slot_number?: number;
    device_path?: string;
    rack_id?: string;
    fx_module_id?: string;
    section?: 'inputFx' | 'trackFx';
    bank?: 'A' | 'B' | 'C' | 'D';
    slot?: 'A' | 'B' | 'C' | 'D';
    source?: 'device' | 'user' | 'bundled';
    notes?: string;
  },
): { envelope: ShareEnvelope } | { error: string } {
  const store = getPresetStore();
  const metaBase = {
    source: args.source,
    notes: args.notes,
    slotNumber: args.slot_number,
  };

  if (kind === 'memory') {
    const resolved = args.config
      ? { config: args.config, source: args.source ?? ('user' as const) }
      : null;
    if (!resolved && args.slot_number != null) {
      const device = resolveDevicePath(args.device_path);
      if ('error' in device) return device;
      try {
        const read = readDeviceSlot(device.path, args.slot_number);
        return {
          envelope: memoryConfigToShare(read.config, {
            ...metaBase,
            name: read.name,
            slotNumber: read.slot_number,
            source: args.source ?? 'device',
          }),
        };
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    }
    if (!args.config) {
      return { error: 'Provide config or slot_number for memory export.' };
    }
    return {
      envelope: memoryConfigToShare(args.config, {
        ...metaBase,
        name: args.config.name,
        slotNumber: args.config.slotNumber,
        source: args.source ?? 'user',
      }),
    };
  }

  if (kind === 'rack') {
    if (args.rack_id) {
      const rack = store.getRack(args.rack_id);
      if (!rack) return { error: `Rack preset not found: ${args.rack_id}.` };
      return {
        envelope: rackToShare(rack, {
          ...metaBase,
          name: rack.title,
          source: args.source ?? (rack.id.startsWith('user-') ? 'user' : 'bundled'),
        }),
      };
    }
    if (!args.config || !args.section || !args.bank) {
      return { error: 'Provide rack_id or config + section + bank for rack export.' };
    }
    try {
      const rack = extractRackFromMemory(args.config, args.section, args.bank);
      return {
        envelope: rackToShare(rack, {
          ...metaBase,
          name: rack.title,
          section: args.section,
          bank: args.bank,
          source: args.source ?? 'user',
        }),
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  if (kind === 'fx_module') {
    if (args.fx_module_id) {
      const mod = store.getFxModule(args.fx_module_id);
      if (!mod) return { error: `FX module not found: ${args.fx_module_id}.` };
      return {
        envelope: fxModuleToShare(mod, {
          ...metaBase,
          name: mod.title,
          source: args.source ?? 'user',
        }),
      };
    }
    if (!args.config || !args.section || !args.bank || !args.slot) {
      return {
        error: 'Provide fx_module_id or config + section + bank + slot for fx_module export.',
      };
    }
    try {
      const mod = extractFxModuleFromMemory(args.config, args.section, args.bank, args.slot);
      return {
        envelope: fxModuleToShare(mod, {
          ...metaBase,
          name: mod.title,
          section: args.section,
          bank: args.bank,
          slot: args.slot,
          source: args.source ?? 'user',
        }),
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  return { error: `Unsupported share kind: ${kind}` };
}

export function handleExportShare(args: Record<string, unknown>): object {
  const v = validateInput(ExportShareInputSchema, args);
  if (!v.success) return { error: v.error };

  const built = buildEnvelopeFromArgs(v.data.kind, v.data);
  if ('error' in built) return built;

  const result: Record<string, unknown> = {
    envelope: built.envelope,
    kind: built.envelope.kind,
  };

  if (v.data.write_to_exports) {
    result.export_path = writeShareJson(built.envelope);
  }

  return result;
}

export function handleImportShare(args: Record<string, unknown>): object {
  const v = validateInput(ImportShareInputSchema, args);
  if (!v.success) return { error: v.error };

  let envelope: ShareEnvelope;
  try {
    envelope = v.data.json
      ? parseShareEnvelopeJson(v.data.json)
      : parseShareEnvelope(v.data.envelope);
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }

  const result: Record<string, unknown> = {
    kind: envelope.kind,
    meta: envelope.meta ?? {},
    payload: envelope.payload,
  };

  if (v.data.write_to_exports) {
    result.export_path = writeShareJson(envelope);
  }

  const store = getPresetStore();

  if (v.data.save_to_store && envelope.kind === 'memory') {
    const saved = store.saveMemoryConfig(envelope.payload);
    result.saved_memory_id = saved.id;
  }

  if (v.data.create_rack_preset && envelope.kind === 'rack') {
    try {
      const rack = store.createRack(envelope.payload);
      result.created_rack_id = rack.id;
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  if (v.data.create_fx_module && envelope.kind === 'fx_module') {
    try {
      const mod = store.createFxModule(envelope.payload);
      result.created_fx_module_id = mod.id;
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  return result;
}

export function handleExportZip(args: Record<string, unknown>): object {
  const v = validateInput(ExportZipInputSchema, args);
  if (!v.success) return { error: v.error };

  let config: MemoryConfig;
  if (v.data.config) {
    config = v.data.config;
  } else if (v.data.rack_id && v.data.slot_number != null) {
    const store = getPresetStore();
    const rack = store.getRack(v.data.rack_id);
    if (!rack) return { error: `Rack preset not found: ${v.data.rack_id}.` };
    config = rackToMemoryConfig(rack, v.data.slot_number);
    if (v.data.name) config.name = v.data.name.slice(0, 12);
  } else if (v.data.slot_number != null) {
    const device = resolveDevicePath(v.data.device_path);
    if ('error' in device) return device;
    try {
      const read = readDeviceSlot(device.path, v.data.slot_number);
      config = read.config;
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  } else {
    return { error: 'Provide config, rack_id + slot_number, or slot_number to export ZIP.' };
  }

  try {
    const template = getDefaultTemplate();
    const zipBytes = generateMemoryZipFromConfig(template, config);
    const filename = `memory-${String(config.slotNumber).padStart(3, '0')}-${slugifyId(config.name)}.zip`;

    const result: Record<string, unknown> = {
      slot_number: config.slotNumber,
      name: config.name,
      zip_base64: zipToBase64(zipBytes),
      filename,
    };

    if (v.data.write_to_exports) {
      result.export_path = writeBinaryExport(filename, zipBytes);
    }

    return result;
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export function handleImportZip(args: Record<string, unknown>): object {
  const v = validateInput(ImportZipInputSchema, args);
  if (!v.success) return { error: v.error };

  try {
    const zipBytes = base64ToZip(v.data.zip_base64);
    const imported = importMemoryZip(zipBytes);

    const result: Record<string, unknown> = {
      slot_number: imported.slot_number,
      name: imported.config.name,
      config: imported.config,
      files: imported.files,
    };

    if (v.data.save_to_store) {
      const saved = getPresetStore().saveMemoryConfig(imported.config);
      result.saved_memory_id = saved.id;
    }

    return result;
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
