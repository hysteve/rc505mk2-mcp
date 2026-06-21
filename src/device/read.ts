/**
 * Read memory slot files from a mounted RC-505mk2 device.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { formatSlotNumber } from '../download/rc0-download.js';
import { parseRC0, parseRC0Pair, parseRC0PairActive } from '../parser/rc0-parser.js';
import type { MemoryConfig } from '../schemas/memory-config.js';
import { DEVICE_DATA_DIR } from './constants.js';
import { checkDeviceSlot } from './upload.js';

export interface DeviceSlotSummary {
  slot_number: number;
  name?: string;
  occupied: boolean;
  has_a: boolean;
  has_b: boolean;
  is_likely_default: boolean;
}

export interface ReadDeviceSlotResult {
  config: MemoryConfig;
  slot_number: number;
  name: string;
  active_side: 'a' | 'b' | 'a_only';
  device_path: string;
  data_dir: string;
  files: { file_a: string; file_b: string };
}

const MEMORY_FILE_RE = /^MEMORY(\d{3})([AB])\.RC0$/i;

const DEFAULT_NAME_RE = /^Memory\d{1,2}$/;

function isLikelyDefault(config: MemoryConfig): boolean {
  return (
    DEFAULT_NAME_RE.test(config.name) &&
    config.inputFx.banks.length === 0 &&
    config.trackFx.banks.length === 0 &&
    (config.master?.tempo === undefined || config.master.tempo === 120)
  );
}

function slotFiles(dataPath: string, slotNumber: number) {
  const slot = formatSlotNumber(slotNumber);
  return {
    fileA: join(dataPath, `MEMORY${slot}A.RC0`),
    fileB: join(dataPath, `MEMORY${slot}B.RC0`),
  };
}

/**
 * Read and parse a memory slot from the device data directory.
 */
export function readDeviceSlot(
  devicePath: string,
  slotNumber: number,
): ReadDeviceSlotResult {
  const dataPath = join(devicePath, DEVICE_DATA_DIR);
  if (!existsSync(dataPath)) {
    throw new Error(`Device data directory not found: ${dataPath}`);
  }

  const { fileA, fileB } = slotFiles(dataPath, slotNumber);
  const slotInfo = checkDeviceSlot(dataPath, slotNumber);
  if (!slotInfo.exists) {
    throw new Error(`Memory slot ${slotNumber} is empty on device.`);
  }

  const hasA = existsSync(fileA);
  const hasB = existsSync(fileB);

  let config: MemoryConfig;
  let activeSide: ReadDeviceSlotResult['active_side'];

  if (hasA && hasB) {
    const xmlA = readFileSync(fileA, 'utf-8');
    const xmlB = readFileSync(fileB, 'utf-8');
    const pair = parseRC0Pair(xmlA, xmlB, slotNumber);
    config = pair.active === 'b' ? pair.b : pair.a;
    activeSide = pair.active;
  } else if (hasA) {
    config = parseRC0(readFileSync(fileA, 'utf-8'), slotNumber);
    activeSide = 'a_only';
  } else {
    config = parseRC0(readFileSync(fileB, 'utf-8'), slotNumber);
    activeSide = 'b';
  }

  return {
    config,
    slot_number: slotNumber,
    name: config.name,
    active_side: activeSide,
    device_path: devicePath,
    data_dir: dataPath,
    files: { file_a: fileA, file_b: fileB },
  };
}

/**
 * List occupied memory slots on the device (1–99).
 */
export function listDeviceSlots(devicePath: string): DeviceSlotSummary[] {
  const dataPath = join(devicePath, DEVICE_DATA_DIR);
  if (!existsSync(dataPath)) {
    throw new Error(`Device data directory not found: ${dataPath}`);
  }

  const slotMap = new Map<number, { hasA: boolean; hasB: boolean }>();

  for (const file of readdirSync(dataPath)) {
    const match = file.match(MEMORY_FILE_RE);
    if (!match) continue;
    const slotNumber = parseInt(match[1]!, 10);
    if (slotNumber < 1 || slotNumber > 99) continue;
    const side = match[2]!.toUpperCase();
    const entry = slotMap.get(slotNumber) ?? { hasA: false, hasB: false };
    if (side === 'A') entry.hasA = true;
    if (side === 'B') entry.hasB = true;
    slotMap.set(slotNumber, entry);
  }

  const summaries: DeviceSlotSummary[] = [];

  for (const [slotNumber, { hasA, hasB }] of slotMap) {
    if (!hasA && !hasB) continue;

    let name: string | undefined;
    let likelyDefault = false;
    try {
      const read = readDeviceSlot(devicePath, slotNumber);
      name = read.name || undefined;
      likelyDefault = isLikelyDefault(read.config);
    } catch {
      name = undefined;
    }

    summaries.push({
      slot_number: slotNumber,
      name,
      occupied: true,
      has_a: hasA,
      has_b: hasB,
      is_likely_default: likelyDefault,
    });
  }

  summaries.sort((a, b) => a.slot_number - b.slot_number);
  return summaries;
}
