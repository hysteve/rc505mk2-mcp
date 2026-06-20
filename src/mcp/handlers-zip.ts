/**
 * MCP handlers for RC0 ZIP export/import (hardware-native sharing).
 */

import { detectDevice } from '../device/detect.js';
import { readDeviceSlot } from '../device/read.js';
import { getDefaultTemplate } from '../template/template-loader.js';
import { rackToMemoryConfig } from '../generator/rc0-generator.js';
import type { MemoryConfig } from '../schemas/memory-config.js';
import {
  base64ToZip,
  generateMemoryZipFromConfig,
  importMemoryZip,
  zipToBase64,
} from '../share/zip.js';
import { writeZipExport } from '../share/write-zip.js';
import { slugifyId } from '../stores/paths.js';
import {
  validateInput,
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

    if (v.data.write_to_disk) {
      result.file_path = writeZipExport(filename, zipBytes);
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
