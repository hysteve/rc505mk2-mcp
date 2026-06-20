import { describe, it, expect } from 'vitest';
import {
  extractRackFromMemory,
  extractFxModuleFromMemory,
} from '../src/share/extract.js';
import type { MemoryConfig } from '../src/schemas/memory-config.js';

const sampleConfig: MemoryConfig = {
  version: 1,
  slotNumber: 5,
  name: 'Vocal Plate',
  inputFx: {
    banks: [
      {
        bank: 'A',
        slots: [
          {
            slot: 'A',
            effect: 'REVERB',
            label: 'Plate',
            params: [{ name: 'TYPE', value: 'PLATE' }],
          },
        ],
      },
    ],
  },
  trackFx: { banks: [] },
  genres: ['Vocals'],
};

describe('extract from MemoryConfig', () => {
  it('extractRackFromMemory builds rack from IFX bank', () => {
    const rack = extractRackFromMemory(sampleConfig, 'inputFx', 'A');
    expect(rack.inputFx).toHaveLength(1);
    expect(rack.inputFx[0].effect).toBe('REVERB');
    expect(rack.trackFx).toHaveLength(0);
  });

  it('extractFxModuleFromMemory builds module from slot', () => {
    const mod = extractFxModuleFromMemory(sampleConfig, 'inputFx', 'A', 'A');
    expect(mod.effect).toBe('REVERB');
    expect(mod.params).toEqual([{ name: 'TYPE', value: 'PLATE' }]);
  });

  it('throws when bank is empty', () => {
    expect(() => extractRackFromMemory(sampleConfig, 'trackFx', 'A')).toThrow(/No FX/);
  });
});
