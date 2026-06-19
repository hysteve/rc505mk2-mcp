/**
 * Upload memory files to a mounted RC-505mk2 device.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { join, resolve } from 'path';
import { formatSlotNumber } from '../download/rc0-download.js';
import { DEVICE_DATA_DIR } from './constants.js';
import { detectDevice, type DeviceInfo } from './detect.js';

export interface UploadResult {
  slot: number;
  devicePath: string;
  volumeName: string;
  backedUp: { fileA: string; fileB: string } | null;
  uploaded: { fileA: string; fileB: string };
}

export interface UploadOptions {
  /** Explicit device path — skips auto-detection */
  devicePath?: string;
  /** Directory to store backups (default: ./rc505-backups) */
  backupDir?: string;
  /** Skip the backup step */
  skipBackup?: boolean;
}

/**
 * Check what currently exists on-device for a given slot.
 * Returns info about existing files for use in overwrite warnings.
 */
export function checkDeviceSlot(
  deviceDataPath: string,
  slotNumber: number,
): { exists: boolean; fileA: string; fileB: string; slotLabel: string } {
  const slot = formatSlotNumber(slotNumber);
  const fileA = join(deviceDataPath, `MEMORY${slot}A.RC0`);
  const fileB = join(deviceDataPath, `MEMORY${slot}B.RC0`);
  const exists = existsSync(fileA) || existsSync(fileB);

  return { exists, fileA, fileB, slotLabel: `Memory ${slotNumber}` };
}

/**
 * Back up existing memory files from the device to a local directory.
 * Creates timestamped backup folders to prevent overwriting previous backups.
 */
function backupSlotFiles(
  deviceDataPath: string,
  slotNumber: number,
  backupDir: string,
): { fileA: string; fileB: string } | null {
  const slot = formatSlotNumber(slotNumber);
  const srcA = join(deviceDataPath, `MEMORY${slot}A.RC0`);
  const srcB = join(deviceDataPath, `MEMORY${slot}B.RC0`);

  const hasA = existsSync(srcA);
  const hasB = existsSync(srcB);
  if (!hasA && !hasB) return null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const slotBackupDir = join(backupDir, `slot-${slotNumber}_${timestamp}`);
  mkdirSync(slotBackupDir, { recursive: true });

  const dstA = join(slotBackupDir, `MEMORY${slot}A.RC0`);
  const dstB = join(slotBackupDir, `MEMORY${slot}B.RC0`);

  if (hasA) copyFileSync(srcA, dstA);
  if (hasB) copyFileSync(srcB, dstB);

  return { fileA: hasA ? dstA : '', fileB: hasB ? dstB : '' };
}

/**
 * Upload generated memory files (A + B) to the mounted RC-505mk2 device.
 *
 * @param xmlA - Content of MEMORYXXXA.RC0
 * @param xmlB - Content of MEMORYXXXB.RC0
 * @param slotNumber - Memory slot (1-99)
 * @param options - Upload options
 */
export function uploadToDevice(
  xmlA: string,
  xmlB: string,
  slotNumber: number,
  options: UploadOptions = {},
): UploadResult {
  // Resolve device
  let device: DeviceInfo;
  if (options.devicePath) {
    device = { path: options.devicePath, volumeName: options.devicePath };
  } else {
    const detected = detectDevice();
    if (!detected) {
      throw new Error(
        'RC-505mk2 not detected. Connect the device via USB, enable Storage mode ' +
        '(MENU > USB > STORAGE > CONNECT), and try again. ' +
        'Or specify the device path explicitly with --device.',
      );
    }
    device = detected;
  }

  const dataPath = join(device.path, DEVICE_DATA_DIR);
  if (!existsSync(dataPath)) {
    throw new Error(`Device data directory not found: ${dataPath}`);
  }

  // Backup existing files
  const backupDir = resolve(options.backupDir ?? './rc505-backups');
  let backedUp: UploadResult['backedUp'] = null;
  if (!options.skipBackup) {
    backedUp = backupSlotFiles(dataPath, slotNumber, backupDir);
  }

  // Write new files
  const slot = formatSlotNumber(slotNumber);
  const fileA = join(dataPath, `MEMORY${slot}A.RC0`);
  const fileB = join(dataPath, `MEMORY${slot}B.RC0`);

  writeFileSync(fileA, xmlA, 'utf-8');
  writeFileSync(fileB, xmlB, 'utf-8');

  return {
    slot: slotNumber,
    devicePath: device.path,
    volumeName: device.volumeName,
    backedUp,
    uploaded: { fileA, fileB },
  };
}
