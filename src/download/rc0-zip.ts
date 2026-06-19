/**
 * RC0 ZIP generation — isomorphic (uses fflate, works in Node and browser).
 */

import { zipSync } from 'fflate';
import type { Rack } from '../types/rack.js';
import type { MemoryConfig } from '../types/memory-config.js';
import { generatePresetXml, memoryConfigToRc0Pair } from '../generator/rc0-generator.js';
import { formatSlotNumber, generateReadmeText, remapRackToBank } from './rc0-download.js';
import type { BuilderExportState } from './rc0-download.js';
import { buildCompositeConfig, generateMemoryReadme } from './rc0-download.js';

const encoder = new TextEncoder();

/** Generate a ZIP buffer containing MEMORY{NNN}A.RC0 + MEMORY{NNN}B.RC0 + readme.txt */
export function generatePresetZipBuffer(
  templateXml: string,
  rack: Rack,
  slotNumber: number = 1,
  bank: 'A' | 'B' | 'C' | 'D' = 'A',
): Uint8Array {
  const remapped = remapRackToBank(rack, bank);
  const xmlA = generatePresetXml(templateXml, remapped, '0001');
  const xmlB = generatePresetXml(templateXml, remapped, '0002');
  const slot = formatSlotNumber(slotNumber);
  const readme = generateReadmeText(rack, slotNumber);

  return zipSync({
    [`MEMORY${slot}A.RC0`]: encoder.encode(xmlA),
    [`MEMORY${slot}B.RC0`]: encoder.encode(xmlB),
    'readme.txt': encoder.encode(readme),
  });
}

/** Generate a ZIP buffer for a composite memory from the Memory Builder */
export function generateMemoryZipBuffer(
  templateXml: string,
  state: BuilderExportState,
  allRacks: Rack[],
): Uint8Array {
  const config = buildCompositeConfig(state, allRacks);
  const { xmlA, xmlB } = memoryConfigToRc0Pair(templateXml, config);
  const slot = formatSlotNumber(state.slotNumber);
  const readme = generateMemoryReadme(state, allRacks);

  return zipSync({
    [`MEMORY${slot}A.RC0`]: encoder.encode(xmlA),
    [`MEMORY${slot}B.RC0`]: encoder.encode(xmlB),
    'readme.txt': encoder.encode(readme),
  });
}
