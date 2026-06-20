/**
 * RC0 ZIP import/export for memory presets.
 */

import { unzipSync, zipSync } from 'fflate';
import { memoryConfigToRc0Pair } from '../generator/rc0-generator.js';
import { parseRC0, parseRC0PairActive } from '../parser/rc0-parser.js';
import { formatSlotNumber } from '../download/rc0-download.js';
import type { MemoryConfig } from '../schemas/memory-config.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const MEMORY_A_RE = /MEMORY(\d{3})A\.RC0$/i;
const MEMORY_B_RE = /MEMORY(\d{3})B\.RC0$/i;

export function generateMemoryZipFromConfig(
  templateXml: string,
  config: MemoryConfig,
): Uint8Array {
  const { xmlA, xmlB } = memoryConfigToRc0Pair(templateXml, config);
  const slot = formatSlotNumber(config.slotNumber);
  const readme =
    `RC-505mk2 Memory Preset\n` +
    `Name: ${config.name}\n` +
    `Slot: ${config.slotNumber}\n\n` +
    `Copy MEMORY${slot}A.RC0 and MEMORY${slot}B.RC0 to ROLAND/DATA/ on the device USB volume.\n`;

  return zipSync({
    [`MEMORY${slot}A.RC0`]: encoder.encode(xmlA),
    [`MEMORY${slot}B.RC0`]: encoder.encode(xmlB),
    'readme.txt': encoder.encode(readme),
  });
}

export interface ImportedMemoryZip {
  config: MemoryConfig;
  slot_number: number;
  files: string[];
}

export function importMemoryZip(zipBytes: Uint8Array): ImportedMemoryZip {
  const entries = unzipSync(zipBytes);
  const names = Object.keys(entries);

  let slotNumber: number | null = null;
  let xmlA: string | null = null;
  let xmlB: string | null = null;

  for (const name of names) {
    const base = name.split('/').pop() ?? name;
    const matchA = base.match(MEMORY_A_RE);
    const matchB = base.match(MEMORY_B_RE);

    if (matchA) {
      slotNumber = parseInt(matchA[1]!, 10);
      xmlA = decoder.decode(entries[name]!);
    } else if (matchB) {
      const sn = parseInt(matchB[1]!, 10);
      if (slotNumber == null) slotNumber = sn;
      xmlB = decoder.decode(entries[name]!);
    }
  }

  if (slotNumber == null || !xmlA) {
    throw new Error('ZIP must contain MEMORYnnnA.RC0 (and ideally MEMORYnnnB.RC0).');
  }

  const config = xmlB
    ? parseRC0PairActive(xmlA, xmlB, slotNumber)
    : parseRC0(xmlA, slotNumber);

  return {
    config,
    slot_number: slotNumber,
    files: names,
  };
}

export function zipToBase64(data: Uint8Array): string {
  return Buffer.from(data).toString('base64');
}

export function base64ToZip(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}
