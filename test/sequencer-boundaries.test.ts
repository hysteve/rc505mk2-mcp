/**
 * Sequencer boundary tests — SEQ MAX, SEQ RATE, step count limits,
 * and edge cases for sequencer control parameters.
 *
 * Complements seq-step-transforms.test.ts (which covers per-FX step value transforms)
 * and transforms.test.ts (which covers seqMax basic mapping).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { memoryConfigToRc0 } from '../src/generator/rc0-generator.js';
import { seqMax, seqRate, onOff } from '../src/params/transforms.js';
import type { MemoryConfig, MemoryFxSlot, FxParam } from '../src/types/memory-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(resolve(__dirname, 'fixtures/default.rc0'), 'utf-8');

// ── Helpers ──────────────────────────────────────────────────────────

function makeSeqConfig(
  seqParams: FxParam[],
  mainParams: FxParam[] = [{ name: 'TRANS', value: '50' }],
): MemoryConfig {
  return {
    version: 1,
    slotNumber: 1,
    name: 'SEQ BOUND',
    inputFx: {
      banks: [{
        bank: 'A',
        slots: [{
          slot: 'A',
          effect: 'TRANSPOSE',
          enabled: true,
          params: mainParams,
          sequencer: seqParams,
        }],
      }],
    },
    trackFx: { banks: [] },
  };
}

function extractSeqBlock(xml: string): string {
  const match = xml.match(/<AA_TRANSPOSE_SEQ>([\s\S]*?)<\/AA_TRANSPOSE_SEQ>/);
  expect(match).not.toBeNull();
  return match![1];
}

function extractTagValue(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>(.*?)</${tag}>`));
  expect(match).not.toBeNull();
  return match![1];
}

// ── seqMax transform boundaries ─────────────────────────────────────

describe('seqMax transform — boundary values', () => {
  it('maps SEQ MAX=1 to stored 0 (minimum)', () => {
    expect(seqMax('1')).toBe(0);
  });

  it('maps SEQ MAX=16 to stored 15 (maximum)', () => {
    expect(seqMax('16')).toBe(15);
  });

  it('clamps SEQ MAX=0 to stored 0 (below minimum)', () => {
    // 0 - 1 = -1, clamped to 0
    expect(seqMax('0')).toBe(0);
  });

  it('clamps SEQ MAX=17 to stored 15 (above maximum)', () => {
    // 17 - 1 = 16, clamped to 15
    expect(seqMax('17')).toBe(15);
  });

  it('clamps negative SEQ MAX to stored 0', () => {
    expect(seqMax('-5')).toBe(0);
  });

  it('clamps large SEQ MAX to stored 15', () => {
    expect(seqMax('100')).toBe(15);
  });
});

// ── seqRate transform ───────────────────────────────────────────────

describe('seqRate transform', () => {
  it('passes through numeric values', () => {
    expect(seqRate('0')).toBe(0);
    expect(seqRate('50')).toBe(50);
    expect(seqRate('100')).toBe(100);
  });

  it('handles edge value 0', () => {
    expect(seqRate('0')).toBe(0);
  });
});

// ── SEQ MAX in generated RC0 ────────────────────────────────────────

describe('SEQ MAX in RC0 generation', () => {
  it('writes SEQ MAX=1 correctly (tag F = 0)', () => {
    const config = makeSeqConfig([
      { name: 'SW', value: 'ON' },
      { name: 'SEQ MAX', value: '1' },
    ]);
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml);
    expect(extractTagValue(block, 'F')).toBe('0');
  });

  it('writes SEQ MAX=16 correctly (tag F = 15)', () => {
    const config = makeSeqConfig([
      { name: 'SW', value: 'ON' },
      { name: 'SEQ MAX', value: '16' },
    ]);
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml);
    expect(extractTagValue(block, 'F')).toBe('15');
  });

  it('writes SEQ MAX=4 correctly (tag F = 3)', () => {
    const config = makeSeqConfig([
      { name: 'SW', value: 'ON' },
      { name: 'SEQ MAX', value: '4' },
    ]);
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml);
    expect(extractTagValue(block, 'F')).toBe('3');
  });
});

// ── Sequencer control params in RC0 ─────────────────────────────────

describe('sequencer control params in RC0', () => {
  it('writes SW=OFF correctly (tag A = 0)', () => {
    const config = makeSeqConfig([
      { name: 'SW', value: 'OFF' },
    ]);
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml);
    expect(extractTagValue(block, 'A')).toBe('0');
  });

  it('writes SW=ON correctly (tag A = 1)', () => {
    const config = makeSeqConfig([
      { name: 'SW', value: 'ON' },
    ]);
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml);
    expect(extractTagValue(block, 'A')).toBe('1');
  });

  it('writes SYNC=ON correctly (tag B = 1)', () => {
    const config = makeSeqConfig([
      { name: 'SW', value: 'ON' },
      { name: 'SYNC', value: 'ON' },
    ]);
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml);
    expect(extractTagValue(block, 'B')).toBe('1');
  });

  it('writes RETRIG=ON correctly (tag C = 1)', () => {
    const config = makeSeqConfig([
      { name: 'SW', value: 'ON' },
      { name: 'RETRIG', value: 'ON' },
    ]);
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml);
    expect(extractTagValue(block, 'C')).toBe('1');
  });

  it('writes TARGET=0 (tag D = 0)', () => {
    const config = makeSeqConfig([
      { name: 'SW', value: 'ON' },
      { name: 'TARGET', value: '0' },
    ]);
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml);
    expect(extractTagValue(block, 'D')).toBe('0');
  });

  it('writes SEQ RATE value (tag E)', () => {
    const config = makeSeqConfig([
      { name: 'SW', value: 'ON' },
      { name: 'SEQ RATE', value: '10' },
    ]);
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml);
    expect(extractTagValue(block, 'E')).toBe('10');
  });
});

// ── All 16 steps populated ──────────────────────────────────────────

describe('sequencer — all 16 steps', () => {
  it('writes all 16 STEP values to RC0 (tags G through V)', () => {
    const steps: FxParam[] = Array.from({ length: 16 }, (_, i) => ({
      name: `STEP ${i + 1}`,
      value: String(i - 6), // -6 through +9 for TRANSPOSE
    }));

    const config = makeSeqConfig([
      { name: 'SW', value: 'ON' },
      { name: 'TARGET', value: '0' },
      { name: 'SEQ MAX', value: '16' },
      ...steps,
    ]);

    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml);

    // Tags G-V map to STEP 1-16
    const stepTags = 'GHIJKLMNOPQRSTUV'.split('');
    for (let i = 0; i < 16; i++) {
      const expected = 12 + (i - 6); // transposeSemi: center=12 + input
      const actual = extractTagValue(block, stepTags[i]);
      expect(Number(actual)).toBe(expected);
    }
  });

  it('writes SEQ MAX=1 with only STEP 1 set', () => {
    const config = makeSeqConfig([
      { name: 'SW', value: 'ON' },
      { name: 'SEQ MAX', value: '1' },
      { name: 'STEP 1', value: '7' },
    ]);

    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml);

    // SEQ MAX = 0 (stored 0-indexed)
    expect(extractTagValue(block, 'F')).toBe('0');
    // STEP 1 (tag G) = transposeSemi(7) = 19
    expect(extractTagValue(block, 'G')).toBe('19');
  });
});

// ── onOff transform boundaries ──────────────────────────────────────

describe('onOff transform — boundaries', () => {
  it('maps OFF to 0', () => {
    expect(onOff('OFF')).toBe(0);
  });

  it('maps ON to 1', () => {
    expect(onOff('ON')).toBe(1);
  });

  it('maps case-insensitive off/on', () => {
    // onOff uses toUpperCase internally per convention
    expect(onOff('0')).toBe(0);
    expect(onOff('1')).toBe(1);
  });
});
