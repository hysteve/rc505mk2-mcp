import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { readDeviceSlot, listDeviceSlots } from '../src/device/read.js';
import { memoryConfigToRc0Pair } from '../src/generator/rc0-generator.js';
import { DEVICE_DATA_DIR } from '../src/device/constants.js';
import type { MemoryConfig } from '../src/schemas/memory-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(__dirname, 'fixtures/default.rc0'), 'utf-8');

function makeConfig(overrides: Partial<MemoryConfig> = {}): MemoryConfig {
  return {
    version: 1,
    slotNumber: 3,
    name: 'DEVICE RD',
    inputFx: {
      banks: [{
        bank: 'A',
        slots: [{
          slot: 'A',
          effect: 'REVERB',
          enabled: true,
          params: [{ name: 'TIME', value: '3.0' }],
        }],
      }],
    },
    trackFx: { banks: [] },
    ...overrides,
  };
}

describe('readDeviceSlot', () => {
  let deviceRoot: string;

  beforeEach(() => {
    deviceRoot = join(tmpdir(), `rc505-read-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(deviceRoot, DEVICE_DATA_DIR), { recursive: true });
  });

  afterEach(() => {
    rmSync(deviceRoot, { recursive: true, force: true });
  });

  it('reads A+B pair and returns active-side config', () => {
    const config = makeConfig();
    const { xmlA, xmlB } = memoryConfigToRc0Pair(template, config);
    const dataPath = join(deviceRoot, DEVICE_DATA_DIR);
    writeFileSync(join(dataPath, 'MEMORY003A.RC0'), xmlA);
    writeFileSync(join(dataPath, 'MEMORY003B.RC0'), xmlB);

    const result = readDeviceSlot(deviceRoot, 3);
    expect(result.slot_number).toBe(3);
    expect(result.name).toBe('DEVICE RD');
    expect(result.active_side).toMatch(/^[ab]|a_only$/);
    expect(result.config.inputFx.banks.length).toBeGreaterThan(0);
  });

  it('falls back to A-only when B is missing', () => {
    const config = makeConfig({ name: 'A ONLY' });
    const { xmlA } = memoryConfigToRc0Pair(template, config);
    const dataPath = join(deviceRoot, DEVICE_DATA_DIR);
    writeFileSync(join(dataPath, 'MEMORY003A.RC0'), xmlA);

    const result = readDeviceSlot(deviceRoot, 3);
    expect(result.name).toBe('A ONLY');
    expect(result.active_side).toBe('a_only');
  });

  it('throws when slot is empty', () => {
    expect(() => readDeviceSlot(deviceRoot, 5)).toThrow(/empty/i);
  });
});

describe('listDeviceSlots', () => {
  let deviceRoot: string;

  beforeEach(() => {
    deviceRoot = join(tmpdir(), `rc505-list-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(deviceRoot, DEVICE_DATA_DIR), { recursive: true });
  });

  afterEach(() => {
    rmSync(deviceRoot, { recursive: true, force: true });
  });

  it('lists occupied slots with names', () => {
    const config = makeConfig({ slotNumber: 7, name: 'SLOT SEVEN' });
    const { xmlA, xmlB } = memoryConfigToRc0Pair(template, config);
    const dataPath = join(deviceRoot, DEVICE_DATA_DIR);
    writeFileSync(join(dataPath, 'MEMORY007A.RC0'), xmlA);
    writeFileSync(join(dataPath, 'MEMORY007B.RC0'), xmlB);

    const slots = listDeviceSlots(deviceRoot);
    expect(slots).toHaveLength(1);
    expect(slots[0]!.slot_number).toBe(7);
    expect(slots[0]!.name).toBe('SLOT SEVEN');
    expect(slots[0]!.has_a).toBe(true);
    expect(slots[0]!.has_b).toBe(true);
  });
});
