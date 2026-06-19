import { describe, it, expect } from 'vitest';
import { formatSlotNumber, generateReadmeText, remapRackToBank, buildCompositeConfig } from '../src/download/rc0-download.js';
import type { Rack } from '../src/types/rack.js';

const makeRack = (overrides?: Partial<Rack>): Rack => ({
  id: 'test-rack',
  section: 'Test',
  title: 'Test Rack',
  icon: '',
  genres: ['Electronic'],
  inputType: '',
  description: 'A test rack',
  inputFx: [
    { slot: 'A', bank: 'A', effect: 'REVERB', params: [{ name: 'TYPE', value: 'HALL1' }] },
  ],
  trackFx: [
    { slot: 'A', bank: 'A', effect: 'DELAY', params: [] },
  ],
  tips: [],
  ...overrides,
});

describe('formatSlotNumber', () => {
  it('pads single-digit slots', () => {
    expect(formatSlotNumber(1)).toBe('001');
    expect(formatSlotNumber(9)).toBe('009');
  });

  it('pads double-digit slots', () => {
    expect(formatSlotNumber(10)).toBe('010');
    expect(formatSlotNumber(99)).toBe('099');
  });

  it('clamps to valid range 1-99', () => {
    expect(formatSlotNumber(0)).toBe('001');
    expect(formatSlotNumber(-5)).toBe('001');
    expect(formatSlotNumber(100)).toBe('099');
    expect(formatSlotNumber(999)).toBe('099');
  });

  it('rounds floating point', () => {
    expect(formatSlotNumber(5.7)).toBe('006');
    expect(formatSlotNumber(5.2)).toBe('005');
  });
});

describe('generateReadmeText', () => {
  it('includes preset name and slot number', () => {
    const rack = makeRack();
    const text = generateReadmeText(rack, 42);
    expect(text).toContain('Test Rack');
    expect(text).toContain('Memory Slot: 42');
    expect(text).toContain('MEMORY042A.RC0');
    expect(text).toContain('MEMORY042B.RC0');
  });

  it('includes genres', () => {
    const text = generateReadmeText(makeRack(), 1);
    expect(text).toContain('Electronic');
  });

  it('includes FX chain info', () => {
    const text = generateReadmeText(makeRack(), 1);
    expect(text).toContain('Input FX Chain');
    expect(text).toContain('REVERB');
    expect(text).toContain('Track FX Chain');
    expect(text).toContain('DELAY');
  });

  it('includes installation instructions', () => {
    const text = generateReadmeText(makeRack(), 1);
    expect(text).toContain('Installation');
    expect(text).toContain('USB');
    expect(text).toContain('ROLAND/DATA');
  });
});

describe('remapRackToBank', () => {
  it('returns same rack for bank A', () => {
    const rack = makeRack();
    expect(remapRackToBank(rack, 'A')).toBe(rack);
  });

  it('remaps all FX to specified bank', () => {
    const rack = makeRack();
    const remapped = remapRackToBank(rack, 'C');
    expect(remapped.inputFx[0].bank).toBe('C');
    expect(remapped.trackFx[0].bank).toBe('C');
  });

  it('preserves original rack immutably', () => {
    const rack = makeRack();
    remapRackToBank(rack, 'B');
    expect(rack.inputFx[0].bank).toBe('A');
  });
});

describe('buildCompositeConfig', () => {
  it('builds MemoryConfig from builder state', () => {
    const rack = makeRack();
    const config = buildCompositeConfig(
      {
        slotNumber: 10,
        memoryName: 'COMPOSITE',
        banks: {
          A: { rackId: 'test-rack', rackTitle: 'Test Rack' },
          B: { rackId: null, rackTitle: null },
          C: { rackId: null, rackTitle: null },
          D: { rackId: null, rackTitle: null },
        },
      },
      [rack],
    );

    expect(config.version).toBe(1);
    expect(config.slotNumber).toBe(10);
    expect(config.name).toBe('COMPOSITE');
    expect(config.inputFx.banks.length).toBe(1);
    expect(config.inputFx.banks[0].bank).toBe('A');
    expect(config.trackFx.banks.length).toBe(1);
  });

  it('uses first rack title when no memoryName provided', () => {
    const rack = makeRack({ title: 'First Rack Title' });
    const config = buildCompositeConfig(
      {
        slotNumber: 1,
        memoryName: '',
        banks: {
          A: { rackId: 'test-rack', rackTitle: 'First Rack Title' },
          B: { rackId: null, rackTitle: null },
          C: { rackId: null, rackTitle: null },
          D: { rackId: null, rackTitle: null },
        },
      },
      [rack],
    );

    expect(config.name).toBe('First Rack T'); // Truncated to 12 chars
  });
});
