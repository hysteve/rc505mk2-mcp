import { describe, it, expect } from 'vitest';
import { validateRackFxPlacement } from '../src/mcp/validate-rack.js';
import type { FxSlotData } from '../src/schemas/rack.js';

const scatterA: FxSlotData = {
  slot: 'A',
  bank: 'A',
  effect: 'BEAT SCATTER',
  params: [{ name: 'TYPE', value: 'P1' }],
};

describe('validateRackFxPlacement', () => {
  it('accepts valid special TFX in bank A and B slot A', () => {
    const err = validateRackFxPlacement({
      inputFx: [],
      trackFx: [
        scatterA,
        {
          slot: 'A',
          bank: 'B',
          effect: 'BEAT_REPEAT',
          params: [{ name: 'TYPE', value: 'FORWARD' }],
        },
      ],
    });
    expect(err).toBeNull();
  });

  it('rejects special TFX in Input FX', () => {
    const err = validateRackFxPlacement({
      inputFx: [{ slot: 'A', effect: 'BEAT_SCATTER', params: [] }],
      trackFx: [],
    });
    expect(err).toContain('Track FX only');
    expect(err).toContain('Input FX slot A');
  });

  it('rejects special TFX outside slot A', () => {
    const err = validateRackFxPlacement({
      inputFx: [],
      trackFx: [
        {
          slot: 'C',
          bank: 'A',
          effect: 'BEAT SCATTER',
          params: [],
        },
      ],
    });
    expect(err).toContain('must be in Slot A');
  });

  it('rejects two special TFX in the same bank', () => {
    const err = validateRackFxPlacement({
      inputFx: [],
      trackFx: [
        scatterA,
        {
          slot: 'A',
          bank: 'A',
          effect: 'BEAT_REPEAT',
          params: [],
        },
      ],
    });
    expect(err).toContain('only one special Track FX allowed per bank');
  });

  it('rejects TFX bank C (slot/bank confusion)', () => {
    const err = validateRackFxPlacement({
      inputFx: [],
      trackFx: [
        { slot: 'A', bank: 'A', effect: 'HPF', params: [] },
        { slot: 'A', bank: 'B', effect: 'GATE_REVERB', params: [] },
        { slot: 'A', bank: 'C', effect: 'DELAY', params: [] },
      ],
    });
    expect(err).toContain('bank must be "A" or "B"');
    expect(err).toContain('three modules in bank A');
  });

  it('rejects bank field on Input FX', () => {
    const err = validateRackFxPlacement({
      inputFx: [{ slot: 'A', bank: 'A', effect: 'REVERB', params: [] }],
      trackFx: [],
    });
    expect(err).toContain('do not set bank on inputFx');
  });
});
