import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { memoryConfigToRc0 } from '../src/generator/rc0-generator.js';
import { parseRC0 } from '../src/parser/rc0-parser.js';
import type { MemoryConfig } from '../src/types/memory-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(resolve(__dirname, 'fixtures/default.rc0'), 'utf-8');

describe('generate → parse roundtrip', () => {
  it('preserves name through roundtrip', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 5,
      name: 'ROUNDTRIP',
      inputFx: { banks: [] },
      trackFx: { banks: [] },
    };

    const xml = memoryConfigToRc0(template, config);
    const parsed = parseRC0(xml, 5);

    expect(parsed.name).toBe('ROUNDTRIP');
    expect(parsed.slotNumber).toBe(5);
  });

  it('preserves master tempo through roundtrip', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 1,
      name: 'TEMPO RT',
      inputFx: { banks: [] },
      trackFx: { banks: [] },
      master: { tempo: 95.5 },
    };

    const xml = memoryConfigToRc0(template, config);
    const parsed = parseRC0(xml, 1);

    // Tempo is stored as integer (x10), so 95.5 → 955 → 95.5
    expect(parsed.master?.tempo).toBe(95.5);
  });

  it('preserves input FX through roundtrip', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 1,
      name: 'IFX RT',
      inputFx: {
        banks: [{
          bank: 'A',
          slots: [{
            slot: 'A',
            effect: 'REVERB',
            enabled: true,
            params: [{ name: 'TIME', value: '5.0' }],
          }],
        }],
      },
      trackFx: { banks: [] },
    };

    const xml = memoryConfigToRc0(template, config);
    const parsed = parseRC0(xml, 1);

    expect(parsed.inputFx.banks.length).toBeGreaterThanOrEqual(1);
    const bankA = parsed.inputFx.banks.find(b => b.bank === 'A');
    expect(bankA).toBeDefined();

    const reverb = bankA?.slots.find(s => s.effect === 'REVERB');
    expect(reverb).toBeDefined();
    expect(reverb?.enabled).toBe(true);

    // The TIME param should round-trip to display value
    const timeParam = reverb?.params.find(p => p.name === 'TIME');
    expect(timeParam?.value).toBe('5.0');
  });

  it('preserves track FX through roundtrip', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 1,
      name: 'TFX RT',
      inputFx: { banks: [] },
      trackFx: {
        banks: [{
          bank: 'A',
          slots: [{
            slot: 'A',
            effect: 'DELAY',
            enabled: true,
            params: [{ name: 'TIME', value: '500' }],
          }],
        }],
      },
    };

    const xml = memoryConfigToRc0(template, config);
    const parsed = parseRC0(xml, 1);

    const bankA = parsed.trackFx.banks.find(b => b.bank === 'A');
    expect(bankA).toBeDefined();

    const delay = bankA?.slots.find(s => s.effect === 'DELAY');
    expect(delay).toBeDefined();
  });

  it('preserves multiple FX slots in same bank', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 1,
      name: 'MULTI FX',
      inputFx: {
        banks: [{
          bank: 'A',
          slots: [
            { slot: 'A', effect: 'EQ', enabled: true, params: [] },
            { slot: 'B', effect: 'DYNAMICS', enabled: true, params: [] },
          ],
        }],
      },
      trackFx: { banks: [] },
    };

    const xml = memoryConfigToRc0(template, config);
    const parsed = parseRC0(xml, 1);

    const bankA = parsed.inputFx.banks.find(b => b.bank === 'A');
    expect(bankA).toBeDefined();
    expect(bankA!.slots.length).toBeGreaterThanOrEqual(2);

    const fxNames = bankA!.slots.map(s => s.effect);
    expect(fxNames).toContain('EQ');
    expect(fxNames).toContain('DYNAMICS');
  });

  it('preserves sequencer settings through roundtrip', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 1,
      name: 'SEQ RT',
      inputFx: {
        banks: [{
          bank: 'A',
          slots: [{
            slot: 'B',
            effect: 'TRANSPOSE',
            enabled: true,
            params: [
              { name: 'TRANS', value: '50' },
              { name: 'MODE', value: '2' },
            ],
            sequencer: [
              { name: 'SW', value: 'ON' },
              { name: 'SYNC', value: 'ON' },
              { name: 'RETRIG', value: 'ON' },
              { name: 'TARGET', value: '0' },
              { name: 'SEQ RATE', value: '6' },
              { name: 'SEQ MAX', value: '8' },
              { name: 'STEP 1', value: '5' },
              { name: 'STEP 2', value: '-7' },
              { name: 'STEP 3', value: '12' },
            ],
          }],
        }],
      },
      trackFx: { banks: [] },
    };

    const xml = memoryConfigToRc0(template, config);
    const parsed = parseRC0(xml, 1);

    const bankA = parsed.inputFx.banks.find(b => b.bank === 'A');
    expect(bankA).toBeDefined();

    const transpose = bankA?.slots.find(s => s.effect === 'TRANSPOSE');
    expect(transpose).toBeDefined();
    expect(transpose?.sequencer).toBeDefined();
    expect(transpose?.sequencer?.length).toBeGreaterThan(0);

    // Verify key sequencer params survived the roundtrip (now display values)
    const sw = transpose?.sequencer?.find(p => p.name === 'SW');
    expect(sw?.value).toBe('ON');

    const step1 = transpose?.sequencer?.find(p => p.name === 'STEP 1');
    expect(step1?.value).toBe('5'); // transposeSemi reverse: RC0 17 → display 5

    const step2 = transpose?.sequencer?.find(p => p.name === 'STEP 2');
    expect(step2?.value).toBe('-7'); // transposeSemi reverse: RC0 5 → display -7
  });

  it('preserves count value through roundtrip', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 1,
      name: 'COUNT RT',
      inputFx: { banks: [] },
      trackFx: { banks: [] },
    };

    const xml = memoryConfigToRc0(template, config, '00AB');
    const parsed = parseRC0(xml, 1);

    expect(parsed.count).toBe('00AB');
  });
});
