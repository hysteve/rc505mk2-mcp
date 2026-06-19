import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generatePresetXml, encodePresetName, memoryConfigToRc0, memoryConfigToRc0Pair } from '../src/generator/rc0-generator.js';
import type { Rack } from '../src/types/rack.js';
import type { MemoryConfig } from '../src/types/memory-config.js';
import { extractCount } from '../src/parser/hex-count.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(resolve(__dirname, 'fixtures/default.rc0'), 'utf-8');

describe('encodePresetName', () => {
  it('encodes ASCII name to char codes', () => {
    const codes = encodePresetName('TEST');
    expect(codes.length).toBe(12);
    expect(codes[0]).toBe('T'.charCodeAt(0));
    expect(codes[1]).toBe('E'.charCodeAt(0));
    expect(codes[2]).toBe('S'.charCodeAt(0));
    expect(codes[3]).toBe('T'.charCodeAt(0));
    // Remaining padded with spaces
    for (let i = 4; i < 12; i++) {
      expect(codes[i]).toBe(32);
    }
  });

  it('truncates names longer than 12 chars', () => {
    const codes = encodePresetName('ABCDEFGHIJKLMNOP');
    expect(codes.length).toBe(12);
    expect(codes[11]).toBe('L'.charCodeAt(0));
  });
});

describe('generatePresetXml', () => {
  it('produces valid XML with preset name', () => {
    const rack: Rack = {
      id: 'test-1',
      section: '',
      title: 'MY PRESET',
      icon: '',
      genres: [],
      inputType: '',
      description: '',
      inputFx: [],
      trackFx: [],
      tips: [],
    };

    const result = generatePresetXml(template, rack);
    expect(result).toContain('<count>0001</count>');
    // Name should be encoded as ASCII codes
    expect(result).toContain(`<A>${'M'.charCodeAt(0)}</A>`);
  });

  it('applies custom count value', () => {
    const rack: Rack = {
      id: 'test-2', section: '', title: 'TEST', icon: '',
      genres: [], inputType: '', description: '',
      inputFx: [], trackFx: [], tips: [],
    };

    const result = generatePresetXml(template, rack, '00FF');
    expect(result).toContain('<count>00FF</count>');
  });

  it('applies input FX settings', () => {
    const rack: Rack = {
      id: 'test-3', section: '', title: 'FX TEST', icon: '',
      genres: [], inputType: '', description: '',
      inputFx: [
        {
          slot: 'A',
          bank: 'A',
          effect: 'REVERB',
          params: [{ name: 'TYPE', value: 'HALL1' }],
        },
      ],
      trackFx: [],
      tips: [],
    };

    const result = generatePresetXml(template, rack);
    // Should contain modified content (we can't easily assert exact values
    // without knowing template structure, but it should differ from template)
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe(template);
  });
});

describe('memoryConfigToRc0', () => {
  it('generates RC0 XML from MemoryConfig', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 1,
      name: 'CONFIG TEST',
      inputFx: { banks: [] },
      trackFx: { banks: [] },
    };

    const xml = memoryConfigToRc0(template, config);
    expect(xml).toContain('<count>');
    expect(xml.length).toBeGreaterThan(0);
  });

  it('applies FX from MemoryConfig banks', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 5,
      name: 'REVERB CFG',
      inputFx: {
        banks: [{
          bank: 'A',
          slots: [{
            slot: 'A',
            effect: 'REVERB',
            enabled: true,
            params: [{ name: 'TYPE', value: '2' }],
          }],
        }],
      },
      trackFx: { banks: [] },
    };

    const xml = memoryConfigToRc0(template, config);
    expect(xml).not.toBe(template);
  });
});

describe('memoryConfigToRc0 sequencer', () => {
  it('writes sequencer params to the XX_FX_SEQ block', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 1,
      name: 'SEQ TEST',
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
              { name: 'STEP 2', value: '-3' },
              { name: 'STEP 3', value: '7' },
              { name: 'STEP 4', value: '12' },
            ],
          }],
        }],
      },
      trackFx: { banks: [] },
    };

    const xml = memoryConfigToRc0(template, config);

    // Find the AB_TRANSPOSE_SEQ block and verify values were written
    const seqMatch = xml.match(/<AB_TRANSPOSE_SEQ>([\s\S]*?)<\/AB_TRANSPOSE_SEQ>/);
    expect(seqMatch).not.toBeNull();
    const seqBlock = seqMatch![1];

    // SW (tag A) = ON = 1
    expect(seqBlock).toMatch(/<A>1<\/A>/);
    // SYNC (tag B) = ON = 1
    expect(seqBlock).toMatch(/<B>1<\/B>/);
    // RETRIG (tag C) = ON = 1
    expect(seqBlock).toMatch(/<C>1<\/C>/);
    // TARGET (tag D) = 0
    expect(seqBlock).toMatch(/<D>0<\/D>/);
    // STEP 1 (tag G) = transposeSemi(5) = 17
    expect(seqBlock).toMatch(/<G>17<\/G>/);
    // STEP 2 (tag H) = transposeSemi(-3) = 9
    expect(seqBlock).toMatch(/<H>9<\/H>/);
    // STEP 3 (tag I) = transposeSemi(7) = 19
    expect(seqBlock).toMatch(/<I>19<\/I>/);
    // STEP 4 (tag J) = transposeSemi(12) = 24
    expect(seqBlock).toMatch(/<J>24<\/J>/);
  });

  it('ignores sequencer params if placed in regular params without sequencer field', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 1,
      name: 'NO AUTO',
      inputFx: {
        banks: [{
          bank: 'A',
          slots: [{
            slot: 'A',
            effect: 'TRANSPOSE',
            enabled: true,
            // Sequencer params in wrong place — should NOT be auto-detected
            params: [
              { name: 'TRANS', value: '50' },
              { name: 'MODE', value: '2' },
              { name: 'SW', value: 'ON' },
              { name: 'STEP 1', value: '-3' },
            ],
          }],
        }],
      },
      trackFx: { banks: [] },
    };

    const xml = memoryConfigToRc0(template, config);

    // SEQ block should remain at defaults (SW=0) since no sequencer field was provided
    const seqMatch = xml.match(/<AA_TRANSPOSE_SEQ>([\s\S]*?)<\/AA_TRANSPOSE_SEQ>/);
    expect(seqMatch).not.toBeNull();
    const seqBlock = seqMatch![1];
    expect(seqBlock).toMatch(/<A>0<\/A>/);
  });
});

describe('memoryConfigToRc0Pair', () => {
  it('generates A and B files with incrementing counts', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 10,
      name: 'PAIR TEST',
      inputFx: { banks: [] },
      trackFx: { banks: [] },
    };

    const { xmlA, xmlB } = memoryConfigToRc0Pair(template, config);
    const countA = extractCount(xmlA);
    const countB = extractCount(xmlB);
    expect(countA).toBe('0001');
    expect(countB).toBe('0002');
  });

  it('uses custom base count', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 1,
      name: 'COUNT TEST',
      inputFx: { banks: [] },
      trackFx: { banks: [] },
    };

    const { xmlA, xmlB } = memoryConfigToRc0Pair(template, config, 100);
    const countA = extractCount(xmlA);
    const countB = extractCount(xmlB);
    expect(countA).toBe('0064'); // 100 in hex
    expect(countB).toBe('0065'); // 101 in hex
  });
});
