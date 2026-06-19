import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseRC0, parseRC0Pair, parseRC0PairActive } from '../src/parser/rc0-parser.js';
import { generatePresetXml, memoryConfigToRc0Pair } from '../src/generator/rc0-generator.js';
import type { Rack } from '../src/types/rack.js';
import type { MemoryConfig } from '../src/types/memory-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(resolve(__dirname, 'fixtures/default.rc0'), 'utf-8');

describe('parseRC0', () => {
  it('parses the default template', () => {
    const config = parseRC0(template, 1);
    expect(config.version).toBe(1);
    expect(config.slotNumber).toBe(1);
    expect(config.inputFx).toBeDefined();
    expect(config.trackFx).toBeDefined();
  });

  it('parses a generated preset with name', () => {
    const rack: Rack = {
      id: 'parse-test', section: '', title: 'HELLO WORLD', icon: '',
      genres: [], inputType: '', description: '',
      inputFx: [], trackFx: [], tips: [],
    };

    const xml = generatePresetXml(template, rack, '0005');
    const config = parseRC0(xml, 42);

    expect(config.slotNumber).toBe(42);
    expect(config.name).toBe('HELLO WORLD');
    expect(config.count).toBe('0005');
  });

  it('parses preset with FX', () => {
    const rack: Rack = {
      id: 'fx-parse-test', section: '', title: 'FX PARSE', icon: '',
      genres: [], inputType: '', description: '',
      inputFx: [
        {
          slot: 'A', bank: 'A', effect: 'REVERB',
          params: [{ name: 'TYPE', value: '2' }],
        },
      ],
      trackFx: [],
      tips: [],
    };

    const xml = generatePresetXml(template, rack);
    const config = parseRC0(xml, 1);

    expect(config.inputFx.banks.length).toBeGreaterThanOrEqual(1);
    const bankA = config.inputFx.banks.find(b => b.bank === 'A');
    if (bankA) {
      const reverbSlot = bankA.slots.find(s => s.effect === 'REVERB');
      expect(reverbSlot).toBeDefined();
      expect(reverbSlot?.enabled).toBe(true);
    }
  });

  it('parses master tempo', () => {
    const rack: Rack = {
      id: 'tempo-test', section: '', title: 'TEMPO', icon: '',
      genres: [], inputType: '', description: '',
      inputFx: [], trackFx: [], tips: [],
      settings: { master: { tempo: 120.0 } },
    };

    const xml = generatePresetXml(template, rack);
    const config = parseRC0(xml, 1);
    expect(config.master?.tempo).toBe(120.0);
  });
});

describe('parseRC0Pair', () => {
  it('identifies the active file by higher count', () => {
    const config: MemoryConfig = {
      version: 1, slotNumber: 1, name: 'PAIR',
      inputFx: { banks: [] }, trackFx: { banks: [] },
    };

    const { xmlA, xmlB } = memoryConfigToRc0Pair(template, config, 1);
    const pair = parseRC0Pair(xmlA, xmlB, 1);

    // B has higher count (2 > 1), so B should be active
    expect(pair.active).toBe('b');
    expect(pair.a.count).toBe('0001');
    expect(pair.b.count).toBe('0002');
  });
});

describe('parseRC0PairActive', () => {
  it('returns the config from the active file', () => {
    const config: MemoryConfig = {
      version: 1, slotNumber: 1, name: 'ACTIVE',
      inputFx: { banks: [] }, trackFx: { banks: [] },
    };

    const { xmlA, xmlB } = memoryConfigToRc0Pair(template, config, 10);
    const active = parseRC0PairActive(xmlA, xmlB, 1);

    // B is active (count 11 > 10)
    expect(active.count).toBe('000B');
  });
});
