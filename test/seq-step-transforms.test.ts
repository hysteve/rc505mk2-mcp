/**
 * Sequencer step transform tests for ALL 15 sequenced FX types.
 *
 * Verifies that STEP 1-16 values written to RC0 use the correct transform
 * derived from the TARGET parameter's parent FX param at generation time.
 *
 * Transform categories:
 *   - num (pass-through):  LPF, BPF, HPF, PHASER, FLANGER, SYNTH,
 *                          RING_MODULATOR, PITCH_BEND, ISOLATOR, OCTAVE,
 *                          TREMOLO, VIBRATO
 *   - transposeSemi:       TRANSPOSE  (-12..+12 → RC0 0..24, center=12)
 *   - oscBotNote:          OSC_BOT    (note+octave → RC0 0..103)
 *   - centered50:          MANUAL_PAN (-50..+50 → RC0 0..100, center=50)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { memoryConfigToRc0 } from '../src/generator/rc0-generator.js';
import type { MemoryConfig, FxSlotId } from '../src/types/memory-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(resolve(__dirname, 'fixtures/default.rc0'), 'utf-8');

// ── Helpers ──────────────────────────────────────────────────────────

/** Build a minimal MemoryConfig with one IFX slot that has a sequencer. */
function makeSeqConfig(
  fxName: string,
  mainParams: Array<{ name: string; value: string }>,
  seqParams: Array<{ name: string; value: string }>,
  slot: FxSlotId = 'A',
): MemoryConfig {
  return {
    version: 1,
    slotNumber: 1,
    name: 'SEQ TEST',
    inputFx: {
      banks: [{
        bank: 'A',
        slots: [{
          slot,
          effect: fxName,
          enabled: true,
          params: mainParams,
          sequencer: seqParams,
        }],
      }],
    },
    trackFx: { banks: [] },
  };
}

/** Extract a named SEQ block from the generated XML. */
function extractSeqBlock(xml: string, slotPrefix: string, seqFxName: string): string {
  const blockName = `${slotPrefix}_${seqFxName}`;
  const re = new RegExp(`<${blockName}>([\\s\\S]*?)</${blockName}>`);
  const match = xml.match(re);
  expect(match, `SEQ block <${blockName}> not found`).not.toBeNull();
  return match![1];
}

/** Assert a tag value inside a block string. */
function expectTag(block: string, tag: string, value: number) {
  expect(block).toMatch(new RegExp(`<${tag}>${value}</${tag}>`));
}

/** Common seq control params: SW=ON, TARGET=0, 4 steps. */
function baseSeqParams(
  steps: Array<{ name: string; value: string }>,
  target = '0',
): Array<{ name: string; value: string }> {
  return [
    { name: 'SW', value: 'ON' },
    { name: 'SYNC', value: 'ON' },
    { name: 'TARGET', value: target },
    { name: 'SEQ RATE', value: '10' },
    { name: 'SEQ MAX', value: '4' },
    ...steps,
  ];
}

// ── Tests: num pass-through targets ──────────────────────────────────

describe('SEQ step transforms — num (pass-through) targets', () => {
  /*
   * For FX whose target params all use `num`, step values should pass
   * through as-is (rounded to integer).
   */

  it('LPF_SEQ — target DEPTH (num)', () => {
    const config = makeSeqConfig(
      'LPF',
      [{ name: 'DEPTH', value: '70' }, { name: 'CUTOFF', value: '50' }],
      baseSeqParams([
        { name: 'STEP 1', value: '20' },
        { name: 'STEP 2', value: '80' },
        { name: 'STEP 3', value: '0' },
        { name: 'STEP 4', value: '100' },
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'LPF_SEQ');

    expectTag(block, 'A', 1);  // SW=ON
    expectTag(block, 'D', 0);  // TARGET=0 (DEPTH)
    expectTag(block, 'G', 20); // STEP 1
    expectTag(block, 'H', 80); // STEP 2
    expectTag(block, 'I', 0);  // STEP 3
    expectTag(block, 'J', 100); // STEP 4
  });

  it('LPF_SEQ — target CUTOFF (num, TARGET=1)', () => {
    const config = makeSeqConfig(
      'LPF',
      [{ name: 'DEPTH', value: '70' }, { name: 'CUTOFF', value: '50' }],
      baseSeqParams([
        { name: 'STEP 1', value: '30' },
        { name: 'STEP 2', value: '90' },
      ], '1'),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'LPF_SEQ');

    expectTag(block, 'D', 1);  // TARGET=1 (CUTOFF)
    expectTag(block, 'G', 30); // STEP 1
    expectTag(block, 'H', 90); // STEP 2
  });

  it('BPF_SEQ — target DEPTH (num)', () => {
    const config = makeSeqConfig(
      'BPF',
      [{ name: 'DEPTH', value: '50' }],
      baseSeqParams([
        { name: 'STEP 1', value: '10' },
        { name: 'STEP 2', value: '90' },
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'BPF_SEQ');

    expectTag(block, 'G', 10);
    expectTag(block, 'H', 90);
  });

  it('HPF_SEQ — target DEPTH (num)', () => {
    const config = makeSeqConfig(
      'HPF',
      [{ name: 'DEPTH', value: '50' }],
      baseSeqParams([
        { name: 'STEP 1', value: '25' },
        { name: 'STEP 2', value: '75' },
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'HPF_SEQ');

    expectTag(block, 'G', 25);
    expectTag(block, 'H', 75);
  });

  it('PHASER_SEQ — target DEPTH (num)', () => {
    const config = makeSeqConfig(
      'PHASER',
      [{ name: 'DEPTH', value: '80' }],
      baseSeqParams([
        { name: 'STEP 1', value: '10' },
        { name: 'STEP 2', value: '50' },
        { name: 'STEP 3', value: '90' },
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'PHASER_SEQ');

    expectTag(block, 'G', 10);
    expectTag(block, 'H', 50);
    expectTag(block, 'I', 90);
  });

  it('PHASER_SEQ — target RESONANCE (num, TARGET=1)', () => {
    const config = makeSeqConfig(
      'PHASER',
      [{ name: 'RESONANCE', value: '60' }],
      baseSeqParams([
        { name: 'STEP 1', value: '20' },
        { name: 'STEP 2', value: '80' },
      ], '1'),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'PHASER_SEQ');

    expectTag(block, 'D', 1);  // TARGET=1
    expectTag(block, 'G', 20);
    expectTag(block, 'H', 80);
  });

  it('FLANGER_SEQ — target DEPTH (num)', () => {
    const config = makeSeqConfig(
      'FLANGER',
      [{ name: 'DEPTH', value: '60' }],
      baseSeqParams([
        { name: 'STEP 1', value: '15' },
        { name: 'STEP 2', value: '85' },
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'FLANGER_SEQ');

    expectTag(block, 'G', 15);
    expectTag(block, 'H', 85);
  });

  it('SYNTH_SEQ — target FREQUENCY (num)', () => {
    const config = makeSeqConfig(
      'SYNTH',
      [{ name: 'FREQUENCY', value: '40' }],
      baseSeqParams([
        { name: 'STEP 1', value: '10' },
        { name: 'STEP 2', value: '40' },
        { name: 'STEP 3', value: '70' },
        { name: 'STEP 4', value: '100' },
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'SYNTH_SEQ');

    expectTag(block, 'G', 10);
    expectTag(block, 'H', 40);
    expectTag(block, 'I', 70);
    expectTag(block, 'J', 100);
  });

  it('RING_MODULATOR_SEQ — target FREQUENCY (num)', () => {
    const config = makeSeqConfig(
      'RING_MODULATOR',
      [{ name: 'FREQUENCY', value: '50' }],
      baseSeqParams([
        { name: 'STEP 1', value: '5' },
        { name: 'STEP 2', value: '95' },
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'RING_MODULATOR_SEQ');

    expectTag(block, 'G', 5);
    expectTag(block, 'H', 95);
  });

  it('PITCH_BEND_SEQ — target BEND (num)', () => {
    const config = makeSeqConfig(
      'PITCH_BEND',
      [{ name: 'BEND', value: '50' }],
      baseSeqParams([
        { name: 'STEP 1', value: '0' },
        { name: 'STEP 2', value: '50' },
        { name: 'STEP 3', value: '100' },
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'PITCH_BEND_SEQ');

    expectTag(block, 'G', 0);
    expectTag(block, 'H', 50);
    expectTag(block, 'I', 100);
  });

  it('ISOLATOR_SEQ — target DEPTH (num)', () => {
    const config = makeSeqConfig(
      'ISOLATOR',
      [{ name: 'DEPTH', value: '60' }],
      baseSeqParams([
        { name: 'STEP 1', value: '0' },
        { name: 'STEP 2', value: '100' },
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'ISOLATOR_SEQ');

    expectTag(block, 'G', 0);
    expectTag(block, 'H', 100);
  });

  it('OCTAVE_SEQ — target OCT.LEVEL (num)', () => {
    const config = makeSeqConfig(
      'OCTAVE',
      [{ name: 'OCT.LEVEL', value: '80' }],
      baseSeqParams([
        { name: 'STEP 1', value: '30' },
        { name: 'STEP 2', value: '70' },
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'OCTAVE_SEQ');

    expectTag(block, 'G', 30);
    expectTag(block, 'H', 70);
  });

  it('TREMOLO_SEQ — target RATE (rateValue = num)', () => {
    const config = makeSeqConfig(
      'TREMOLO',
      [{ name: 'RATE', value: '50' }],
      baseSeqParams([
        { name: 'STEP 1', value: '10' },
        { name: 'STEP 2', value: '90' },
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'TREMOLO_SEQ');

    expectTag(block, 'G', 10);
    expectTag(block, 'H', 90);
  });

  it('TREMOLO_SEQ — target WAVEFORM (num, TARGET=1)', () => {
    const config = makeSeqConfig(
      'TREMOLO',
      [{ name: 'WAVEFORM', value: '50' }],
      baseSeqParams([
        { name: 'STEP 1', value: '20' },
        { name: 'STEP 2', value: '60' },
      ], '1'),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'TREMOLO_SEQ');

    expectTag(block, 'D', 1);  // TARGET=1 (WAVEFORM)
    expectTag(block, 'G', 20);
    expectTag(block, 'H', 60);
  });

  it('VIBRATO_SEQ — target COLOR (num)', () => {
    const config = makeSeqConfig(
      'VIBRATO',
      [{ name: 'COLOR', value: '40' }],
      baseSeqParams([
        { name: 'STEP 1', value: '0' },
        { name: 'STEP 2', value: '50' },
        { name: 'STEP 3', value: '100' },
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'VIBRATO_SEQ');

    expectTag(block, 'G', 0);
    expectTag(block, 'H', 50);
    expectTag(block, 'I', 100);
  });
});

// ── Tests: transposeSemi target ──────────────────────────────────────

describe('SEQ step transforms — TRANSPOSE_SEQ (transposeSemi)', () => {
  /*
   * transposeSemi: input -12..+12 → RC0 0..24, center = 12
   * Formula: RC0 = clamp(0, 24, 12 + input)
   */

  it('maps semitone values to RC0 offset range', () => {
    const config = makeSeqConfig(
      'TRANSPOSE',
      [{ name: 'TRANS', value: '0' }],
      baseSeqParams([
        { name: 'STEP 1', value: '0' },   // 12 + 0  = 12
        { name: 'STEP 2', value: '5' },   // 12 + 5  = 17
        { name: 'STEP 3', value: '-5' },  // 12 + -5 = 7
        { name: 'STEP 4', value: '12' },  // 12 + 12 = 24
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'TRANSPOSE_SEQ');

    expectTag(block, 'A', 1);  // SW=ON
    expectTag(block, 'G', 12); // STEP 1: 0 semitones
    expectTag(block, 'H', 17); // STEP 2: +5 semitones
    expectTag(block, 'I', 7);  // STEP 3: -5 semitones
    expectTag(block, 'J', 24); // STEP 4: +12 semitones (max)
  });

  it('clamps out-of-range semitone values', () => {
    const config = makeSeqConfig(
      'TRANSPOSE',
      [{ name: 'TRANS', value: '0' }],
      baseSeqParams([
        { name: 'STEP 1', value: '-12' },  // 12 + -12 = 0 (min)
        { name: 'STEP 2', value: '-20' },  // 12 + -20 = -8 → clamped to 0
        { name: 'STEP 3', value: '20' },   // 12 + 20  = 32 → clamped to 24
        { name: 'STEP 4', value: '-7' },   // 12 + -7  = 5
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'TRANSPOSE_SEQ');

    expectTag(block, 'G', 0);  // STEP 1: -12 (min)
    expectTag(block, 'H', 0);  // STEP 2: clamped to 0
    expectTag(block, 'I', 24); // STEP 3: clamped to 24
    expectTag(block, 'J', 5);  // STEP 4: -7 semitones
  });

  it('writes to correct slot prefix (Bank A Slot B)', () => {
    const config = makeSeqConfig(
      'TRANSPOSE',
      [{ name: 'TRANS', value: '0' }],
      baseSeqParams([{ name: 'STEP 1', value: '3' }]),
      'B',
    );
    const xml = memoryConfigToRc0(template, config);
    // Slot B in Bank A = prefix AB
    const block = extractSeqBlock(xml, 'AB', 'TRANSPOSE_SEQ');

    expectTag(block, 'G', 15); // 12 + 3 = 15
  });
});

// ── Tests: oscBotNote target ─────────────────────────────────────────

describe('SEQ step transforms — OSC_BOT_SEQ (oscBotNote)', () => {
  /*
   * oscBotNote: "C2" → (2-1)*12 + 0 = 12, "A4" → (4-1)*12 + 9 = 45
   * Raw numeric values also accepted (pass-through via num).
   */

  it('maps note names to RC0 values', () => {
    const config = makeSeqConfig(
      'OSC_BOT',
      [{ name: 'NOTE', value: 'C3' }],
      baseSeqParams([
        { name: 'STEP 1', value: 'C1' },   // (1-1)*12 + 0 = 0
        { name: 'STEP 2', value: 'C2' },   // (2-1)*12 + 0 = 12
        { name: 'STEP 3', value: 'A4' },   // (4-1)*12 + 9 = 45
        { name: 'STEP 4', value: 'G9' },   // (9-1)*12 + 7 = 103 (max)
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'OSC_BOT_SEQ');

    expectTag(block, 'G', 0);   // C1
    expectTag(block, 'H', 12);  // C2
    expectTag(block, 'I', 45);  // A4
    expectTag(block, 'J', 103); // G9 (max)
  });

  it('maps sharp notes correctly', () => {
    const config = makeSeqConfig(
      'OSC_BOT',
      [{ name: 'NOTE', value: 'C3' }],
      baseSeqParams([
        { name: 'STEP 1', value: 'C#2' },  // (2-1)*12 + 1 = 13
        { name: 'STEP 2', value: 'F#3' },  // (3-1)*12 + 6 = 30
        { name: 'STEP 3', value: 'G#4' },  // (4-1)*12 + 8 = 44
        { name: 'STEP 4', value: 'A#5' },  // (5-1)*12 + 10 = 58
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'OSC_BOT_SEQ');

    expectTag(block, 'G', 13);  // C#2
    expectTag(block, 'H', 30);  // F#3
    expectTag(block, 'I', 44);  // G#4
    expectTag(block, 'J', 58);  // A#5
  });

  it('accepts raw numeric values as pass-through', () => {
    const config = makeSeqConfig(
      'OSC_BOT',
      [{ name: 'NOTE', value: 'C3' }],
      baseSeqParams([
        { name: 'STEP 1', value: '0' },
        { name: 'STEP 2', value: '48' },
        { name: 'STEP 3', value: '103' },
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'OSC_BOT_SEQ');

    expectTag(block, 'G', 0);
    expectTag(block, 'H', 48);
    expectTag(block, 'I', 103);
  });
});

// ── Tests: centered50 target ─────────────────────────────────────────

describe('SEQ step transforms — MANUAL_PAN_SEQ (centered50)', () => {
  /*
   * centered50: input -50..+50 → RC0 0..100, center = 50
   * Formula: RC0 = clamp(0, 100, 50 + input)
   */

  it('maps centered pan values to RC0 offset range', () => {
    const config = makeSeqConfig(
      'MANUAL_PAN',
      [{ name: 'POSITION', value: '0' }],
      baseSeqParams([
        { name: 'STEP 1', value: '0' },    // 50 + 0  = 50 (center)
        { name: 'STEP 2', value: '-50' },   // 50 + -50 = 0 (hard left)
        { name: 'STEP 3', value: '50' },    // 50 + 50  = 100 (hard right)
        { name: 'STEP 4', value: '25' },    // 50 + 25  = 75
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'MANUAL_PAN_SEQ');

    expectTag(block, 'A', 1);   // SW=ON
    expectTag(block, 'G', 50);  // STEP 1: center
    expectTag(block, 'H', 0);   // STEP 2: hard left
    expectTag(block, 'I', 100); // STEP 3: hard right
    expectTag(block, 'J', 75);  // STEP 4: right of center
  });

  it('clamps out-of-range pan values', () => {
    const config = makeSeqConfig(
      'MANUAL_PAN',
      [{ name: 'POSITION', value: '0' }],
      baseSeqParams([
        { name: 'STEP 1', value: '-80' },  // 50 + -80 = -30 → clamped to 0
        { name: 'STEP 2', value: '80' },   // 50 + 80  = 130 → clamped to 100
        { name: 'STEP 3', value: '-25' },  // 50 + -25 = 25
      ]),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'MANUAL_PAN_SEQ');

    expectTag(block, 'G', 0);   // clamped to 0
    expectTag(block, 'H', 100); // clamped to 100
    expectTag(block, 'I', 25);  // -25 → 25
  });
});

// ── Tests: multi-target FX with TARGET switching ─────────────────────

describe('SEQ step transforms — multi-target FX', () => {
  it('FLANGER_SEQ target 2 (MANUAL) uses num', () => {
    // FLANGER_SEQ targets: [DEPTH, RESONANCE, MANUAL, D.LEVEL, SEPARATION]
    const config = makeSeqConfig(
      'FLANGER',
      [{ name: 'MANUAL', value: '40' }],
      baseSeqParams([
        { name: 'STEP 1', value: '10' },
        { name: 'STEP 2', value: '90' },
      ], '2'),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'FLANGER_SEQ');

    expectTag(block, 'D', 2);  // TARGET=2 (MANUAL)
    expectTag(block, 'G', 10); // num pass-through
    expectTag(block, 'H', 90);
  });

  it('SYNTH_SEQ target 1 (RESONANCE) uses num', () => {
    const config = makeSeqConfig(
      'SYNTH',
      [{ name: 'RESONANCE', value: '60' }],
      baseSeqParams([
        { name: 'STEP 1', value: '5' },
        { name: 'STEP 2', value: '95' },
      ], '1'),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'SYNTH_SEQ');

    expectTag(block, 'D', 1);
    expectTag(block, 'G', 5);
    expectTag(block, 'H', 95);
  });

  it('VIBRATO_SEQ target 1 (D.LEVEL) uses num', () => {
    const config = makeSeqConfig(
      'VIBRATO',
      [{ name: 'D.LEVEL', value: '50' }],
      baseSeqParams([
        { name: 'STEP 1', value: '20' },
        { name: 'STEP 2', value: '80' },
      ], '1'),
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'VIBRATO_SEQ');

    expectTag(block, 'D', 1);
    expectTag(block, 'G', 20);
    expectTag(block, 'H', 80);
  });
});

// ── Tests: control params are unaffected by step transform ───────────

describe('SEQ control params — always use their own transforms', () => {
  it('TRANSPOSE_SEQ control params use seq transforms, not transposeSemi', () => {
    const config = makeSeqConfig(
      'TRANSPOSE',
      [{ name: 'TRANS', value: '0' }],
      [
        { name: 'SW', value: 'ON' },       // onOff → 1
        { name: 'SYNC', value: 'OFF' },     // onOff → 0
        { name: 'RETRIG', value: 'ON' },    // onOff → 1
        { name: 'TARGET', value: '0' },     // num → 0
        { name: 'SEQ RATE', value: '15' },  // seqRate (= num) → 15
        { name: 'SEQ MAX', value: '8' },    // seqMax → 8-1 = 7 (0-indexed)
        { name: 'STEP 1', value: '7' },     // transposeSemi → 12+7 = 19
      ],
    );
    const xml = memoryConfigToRc0(template, config);
    const block = extractSeqBlock(xml, 'AA', 'TRANSPOSE_SEQ');

    expectTag(block, 'A', 1);  // SW=ON
    expectTag(block, 'B', 0);  // SYNC=OFF
    expectTag(block, 'C', 1);  // RETRIG=ON
    expectTag(block, 'D', 0);  // TARGET=0
    expectTag(block, 'E', 15); // SEQ RATE=15
    expectTag(block, 'F', 7);  // SEQ MAX=8 → stored as 7
    expectTag(block, 'G', 19); // STEP 1: transposeSemi(7) = 19
  });
});
