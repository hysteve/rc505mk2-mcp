import { describe, it, expect } from 'vitest';
import {
  FxSlotIdSchema,
  FxContextSchema,
  FxParamSchema,
  FxModuleSchema,
  FxSlotDataSchema,
  RackSchema,
  MemoryFxSlotSchema,
  MemoryBankSchema,
  MemoryFxSectionSchema,
  MemoryConfigSchema,
  MemoryTrackSettingsSchema,
  MemoryMasterSettingsSchema,
  MemoryFilePairSchema,
  buildFxParamsSchema,
  validateFxModuleParams,
} from '../src/schemas/index.js';

// ── FxParam & FxSlotId ──────────────────────────────────────────────

describe('FxSlotIdSchema', () => {
  it('accepts valid slot IDs', () => {
    expect(FxSlotIdSchema.parse('A')).toBe('A');
    expect(FxSlotIdSchema.parse('D')).toBe('D');
  });

  it('rejects invalid slot IDs', () => {
    expect(() => FxSlotIdSchema.parse('E')).toThrow();
    expect(() => FxSlotIdSchema.parse('a')).toThrow();
    expect(() => FxSlotIdSchema.parse('')).toThrow();
  });
});

describe('FxContextSchema', () => {
  it('accepts ifx and tfx', () => {
    expect(FxContextSchema.parse('ifx')).toBe('ifx');
    expect(FxContextSchema.parse('tfx')).toBe('tfx');
  });

  it('rejects invalid contexts', () => {
    expect(() => FxContextSchema.parse('IFX')).toThrow();
    expect(() => FxContextSchema.parse('other')).toThrow();
  });
});

describe('FxParamSchema', () => {
  it('accepts valid params', () => {
    const result = FxParamSchema.parse({ name: 'TYPE', value: 'HALL1' });
    expect(result).toEqual({ name: 'TYPE', value: 'HALL1' });
  });

  it('rejects empty name', () => {
    expect(() => FxParamSchema.parse({ name: '', value: '5' })).toThrow();
  });

  it('rejects missing fields', () => {
    expect(() => FxParamSchema.parse({ name: 'TYPE' })).toThrow();
    expect(() => FxParamSchema.parse({ value: '5' })).toThrow();
  });
});

// ── FxModule ────────────────────────────────────────────────────────

describe('FxModuleSchema', () => {
  const validModule = {
    id: 'hall-wash',
    effect: 'REVERB',
    title: 'Hall Wash',
    category: 'space',
    context: ['ifx', 'tfx'],
    usage: 'both',
    description: 'Long lush hall reverb',
    params: [
      { name: 'TYPE', value: 'HALL1' },
      { name: 'TIME', value: '5.0' },
    ],
    tags: ['ambient', 'wash'],
    pairsWith: ['echo-fadeout'],
  };

  it('accepts a valid FxModule', () => {
    const result = FxModuleSchema.parse(validModule);
    expect(result.id).toBe('hall-wash');
    expect(result.params).toHaveLength(2);
  });

  it('accepts module without optional fields', () => {
    const { tags, pairsWith, ...minimal } = validModule;
    const result = FxModuleSchema.parse(minimal);
    expect(result.tags).toBeUndefined();
  });

  it('accepts module with sequencer', () => {
    const withSeq = {
      ...validModule,
      sequencer: [
        { name: 'SW', value: 'ON' },
        { name: 'TARGET', value: '0' },
        { name: 'STEP 1', value: '5.0' },
      ],
    };
    const result = FxModuleSchema.parse(withSeq);
    expect(result.sequencer).toHaveLength(3);
  });

  it('rejects invalid ID format', () => {
    expect(() => FxModuleSchema.parse({ ...validModule, id: 'Hall Wash' })).toThrow();
    expect(() => FxModuleSchema.parse({ ...validModule, id: 'HALL' })).toThrow();
  });

  it('rejects invalid usage', () => {
    expect(() => FxModuleSchema.parse({ ...validModule, usage: 'standalone' })).toThrow();
  });

  it('rejects empty context', () => {
    expect(() => FxModuleSchema.parse({ ...validModule, context: [] })).toThrow();
  });
});

// ── FxSlotData ──────────────────────────────────────────────────────

describe('FxSlotDataSchema', () => {
  it('accepts valid slot data', () => {
    const result = FxSlotDataSchema.parse({
      slot: 'A',
      effect: 'DYNAMICS',
      params: [{ name: 'TYPE', value: 'NATURAL COMP' }],
    });
    expect(result.slot).toBe('A');
  });

  it('accepts slot data with bank and sequencer', () => {
    const result = FxSlotDataSchema.parse({
      slot: 'B',
      bank: 'A',
      label: 'Compressor',
      effect: 'DYNAMICS',
      params: [],
      sequencer: [{ name: 'SW', value: 'ON' }],
    });
    expect(result.bank).toBe('A');
    expect(result.sequencer).toHaveLength(1);
  });
});

// ── MemoryConfig ────────────────────────────────────────────────────

describe('MemoryConfigSchema', () => {
  const minimalConfig = {
    version: 1 as const,
    slotNumber: 1,
    name: 'TEST',
    inputFx: { banks: [] },
    trackFx: { banks: [] },
  };

  it('accepts a minimal config', () => {
    const result = MemoryConfigSchema.parse(minimalConfig);
    expect(result.slotNumber).toBe(1);
    expect(result.name).toBe('TEST');
  });

  it('accepts a full config', () => {
    const full = {
      ...minimalConfig,
      slotNumber: 42,
      inputFx: {
        activeBank: 0,
        banks: [{
          bank: 'A',
          slots: [{
            slot: 'A',
            effect: 'REVERB',
            enabled: true,
            params: [{ name: 'TYPE', value: 'HALL1' }],
          }],
        }],
      },
      trackFx: { banks: [] },
      tracks: [{ trackNumber: 1, level: 100, pan: 50 }],
      master: { tempo: 120 },
      rec: { recAction: 0 },
      play: { currentTrack: 0 },
      rhythm: { genre: 5 },
      sourceRackId: 'vocal-chain',
      genres: ['pop', 'electronic'],
      count: '000A',
    };
    const result = MemoryConfigSchema.parse(full);
    expect(result.inputFx.banks).toHaveLength(1);
    expect(result.tracks).toHaveLength(1);
  });

  it('rejects invalid version', () => {
    expect(() => MemoryConfigSchema.parse({ ...minimalConfig, version: 2 })).toThrow();
  });

  it('rejects slot number out of range', () => {
    expect(() => MemoryConfigSchema.parse({ ...minimalConfig, slotNumber: 0 })).toThrow();
    expect(() => MemoryConfigSchema.parse({ ...minimalConfig, slotNumber: 100 })).toThrow();
  });

  it('rejects name too long', () => {
    expect(() => MemoryConfigSchema.parse({ ...minimalConfig, name: 'A'.repeat(13) })).toThrow();
  });

  it('rejects invalid count format', () => {
    expect(() => MemoryConfigSchema.parse({ ...minimalConfig, count: 'GGGG' })).toThrow();
    expect(() => MemoryConfigSchema.parse({ ...minimalConfig, count: '12345' })).toThrow();
  });

  it('rejects too many banks', () => {
    const tooManyBanks = {
      ...minimalConfig,
      inputFx: {
        banks: [
          { bank: 'A', slots: [] },
          { bank: 'B', slots: [] },
          { bank: 'C', slots: [] },
          { bank: 'D', slots: [] },
          { bank: 'A', slots: [] }, // 5th bank
        ],
      },
    };
    expect(() => MemoryConfigSchema.parse(tooManyBanks)).toThrow();
  });
});

describe('MemoryTrackSettingsSchema', () => {
  it('accepts valid track settings', () => {
    const result = MemoryTrackSettingsSchema.parse({
      trackNumber: 3,
      level: 150,
      pan: 50,
      reverse: false,
    });
    expect(result.trackNumber).toBe(3);
  });

  it('rejects invalid track number', () => {
    expect(() => MemoryTrackSettingsSchema.parse({ trackNumber: 0 })).toThrow();
    expect(() => MemoryTrackSettingsSchema.parse({ trackNumber: 6 })).toThrow();
  });

  it('rejects level out of range', () => {
    expect(() => MemoryTrackSettingsSchema.parse({ trackNumber: 1, level: 201 })).toThrow();
  });
});

describe('MemoryMasterSettingsSchema', () => {
  it('accepts valid tempo', () => {
    const result = MemoryMasterSettingsSchema.parse({ tempo: 120 });
    expect(result.tempo).toBe(120);
  });

  it('rejects tempo out of range', () => {
    expect(() => MemoryMasterSettingsSchema.parse({ tempo: 39 })).toThrow();
    expect(() => MemoryMasterSettingsSchema.parse({ tempo: 301 })).toThrow();
  });
});

describe('MemoryFilePairSchema', () => {
  const config = {
    version: 1 as const,
    slotNumber: 1,
    name: 'TEST',
    inputFx: { banks: [] },
    trackFx: { banks: [] },
  };

  it('accepts valid file pair', () => {
    const result = MemoryFilePairSchema.parse({ a: config, b: config, active: 'a' });
    expect(result.active).toBe('a');
  });

  it('rejects invalid active flag', () => {
    expect(() => MemoryFilePairSchema.parse({ a: config, b: config, active: 'c' })).toThrow();
  });
});

// ── Dynamic Param Validators ────────────────────────────────────────

describe('buildFxParamsSchema', () => {
  it('returns pass-through schema for unknown FX', () => {
    const schema = buildFxParamsSchema('NONEXISTENT');
    const result = schema.parse([{ name: 'FOO', value: 'BAR' }]);
    expect(result).toHaveLength(1);
  });

  it('validates DYNAMICS params correctly', () => {
    const schema = buildFxParamsSchema('DYNAMICS');
    const result = schema.safeParse([
      { name: 'TYPE', value: 'NATURAL COMP' },
      { name: 'DYNAMICS', value: '-6' },
    ]);
    expect(result.success).toBe(true);
  });

  it('flags unknown param names', () => {
    const schema = buildFxParamsSchema('DYNAMICS');
    const result = schema.safeParse([
      { name: 'NONEXISTENT', value: '5' },
    ]);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('Unknown param');
  });

  it('flags out-of-range numeric values', () => {
    const schema = buildFxParamsSchema('DYNAMICS');
    const result = schema.safeParse([
      { name: 'DYNAMICS', value: '99' }, // eqGain range is -20..20
    ]);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('out of range');
  });

  it('flags invalid enum values', () => {
    const schema = buildFxParamsSchema('DYNAMICS');
    const result = schema.safeParse([
      { name: 'TYPE', value: 'INVALID_TYPE' },
    ]);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('Invalid value');
  });

  it('accepts numeric fallback for enum params', () => {
    const schema = buildFxParamsSchema('DYNAMICS');
    const result = schema.safeParse([
      { name: 'TYPE', value: '3' }, // numeric fallback is valid
    ]);
    expect(result.success).toBe(true);
  });
});

describe('validateFxModuleParams', () => {
  it('validates REVERB params', () => {
    const result = validateFxModuleParams('REVERB', [
      { name: 'TIME', value: '5.0' },
      { name: 'PRE DELAY', value: '30' },
      { name: 'E.LEVEL', value: '100' },
    ]);
    expect(result.success).toBe(true);
  });

  it('reports invalid REVERB param name', () => {
    const result = validateFxModuleParams('REVERB', [
      { name: 'INVALID', value: '5' },
    ]);
    expect(result.success).toBe(false);
  });
});

// ── Rack Schema ─────────────────────────────────────────────────────

describe('RackSchema', () => {
  const validRack = {
    id: 'vocal-chain',
    section: 'vocal',
    title: 'Vocal Processing',
    icon: '🎤',
    genres: ['pop', 'rock'],
    inputType: 'MIC',
    description: 'A vocal processing chain',
    inputFx: [
      { slot: 'A', effect: 'DYNAMICS', params: [{ name: 'TYPE', value: 'NATURAL COMP' }] },
    ],
    trackFx: [],
    tips: [{ type: 'tip', title: 'Tip', text: 'Try adjusting dynamics' }],
  };

  it('accepts a valid rack', () => {
    const result = RackSchema.parse(validRack);
    expect(result.id).toBe('vocal-chain');
    expect(result.inputFx).toHaveLength(1);
  });

  it('accepts rack with optional settings', () => {
    const withSettings = {
      ...validRack,
      settings: {
        master: { tempo: 120 },
        tracks: [{ trackNumber: 1, level: 100 }],
      },
      tags: ['vocal', 'compressor'],
      badge: 'new',
    };
    const result = RackSchema.parse(withSettings);
    expect(result.settings?.master?.tempo).toBe(120);
    expect(result.badge).toBe('new');
  });

  it('rejects invalid badge', () => {
    expect(() => RackSchema.parse({ ...validRack, badge: 'invalid' })).toThrow();
  });
});
