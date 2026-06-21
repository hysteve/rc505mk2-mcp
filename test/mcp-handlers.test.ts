import { describe, it, expect } from 'vitest';
import {
  handleListFxTypes,
  handleLookupFxParams,
  handleDetectDevice,
  handleEjectDevice,
  handleGetDeviceSchema,
  handleParseMemory,
} from '../src/mcp/handlers.js';

describe('handleListFxTypes', () => {
  it('returns all FX types when no context filter', () => {
    const result = handleListFxTypes({}) as { fx_types: Array<{ name: string }>; count: number };
    expect(result.count).toBeGreaterThan(40);
    expect(result.fx_types.some(fx => fx.name === 'REVERB')).toBe(true);
    expect(result.fx_types.some(fx => fx.name === 'DELAY')).toBe(true);
  });

  it('excludes special track FX when context is ifx', () => {
    const result = handleListFxTypes({ context: 'ifx' }) as { fx_types: Array<{ name: string; trackFxOnly: boolean }>; count: number };
    expect(result.fx_types.some(fx => fx.name === 'BEAT_SCATTER')).toBe(false);
    expect(result.fx_types.some(fx => fx.name === 'REVERB')).toBe(true);
  });

  it('includes special track FX when context is tfx', () => {
    const result = handleListFxTypes({ context: 'tfx' }) as { fx_types: Array<{ name: string }>; count: number };
    expect(result.fx_types.some(fx => fx.name === 'BEAT_SCATTER')).toBe(true);
  });

  it('each FX type has params array', () => {
    const result = handleListFxTypes({}) as { fx_types: Array<{ name: string; params: string[] }> };
    const reverb = result.fx_types.find(fx => fx.name === 'REVERB');
    expect(reverb).toBeDefined();
    expect(Array.isArray(reverb!.params)).toBe(true);
    expect(reverb!.params.length).toBeGreaterThan(0);
  });

  it('shows structured sequencer info for sequenceable FX', () => {
    const result = handleListFxTypes({}) as {
      fx_types: Array<{ name: string; sequencer: { available: boolean; targets: string[] } | null }>;
    };
    const transpose = result.fx_types.find(fx => fx.name === 'TRANSPOSE');
    expect(transpose).toBeDefined();
    expect(transpose!.sequencer).not.toBeNull();
    expect(transpose!.sequencer!.available).toBe(true);
    expect(transpose!.sequencer!.targets).toEqual(['TRANS']);

    const reverb = result.fx_types.find(fx => fx.name === 'REVERB');
    expect(reverb).toBeDefined();
    expect(reverb!.sequencer).toBeNull();
  });
});

describe('handleLookupFxParams', () => {
  it('returns params for a known FX type', () => {
    const result = handleLookupFxParams({ fx_name: 'REVERB' }) as {
      fx_name: string;
      params: Array<{ name: string; tag: string }>;
    };
    expect(result.fx_name).toBe('REVERB');
    expect(result.params.length).toBeGreaterThan(0);
    expect(result.params.some(p => p.name === 'TIME')).toBe(true);
  });

  it('resolves friendly names via EFFECT_NAME_MAP', () => {
    const result = handleLookupFxParams({ fx_name: 'reverb' }) as { fx_name: string };
    expect(result.fx_name).toBe('REVERB');
  });

  it('returns error for unknown FX', () => {
    const result = handleLookupFxParams({ fx_name: 'NONEXISTENT' }) as { error: string };
    expect(result.error).toContain('Unknown FX type');
  });
});

describe('handleLookupFxParams sequencer', () => {
  it('returns structured sequencer info for FX with sequencer support', () => {
    const result = handleLookupFxParams({ fx_name: 'TRANSPOSE' }) as {
      sequencer: {
        available: boolean;
        targets: Array<{ index: number; param: string; stepValueType: object }>;
        controlParams: Array<{ name: string }>;
        stepCount: number;
        stepParamNames: string[];
      };
    };
    expect(result.sequencer).not.toBeNull();
    expect(result.sequencer.available).toBe(true);
    expect(result.sequencer.targets).toHaveLength(1);
    expect(result.sequencer.targets[0].index).toBe(0);
    expect(result.sequencer.targets[0].param).toBe('TRANS');
    expect(result.sequencer.targets[0].stepValueType).toBeDefined();
    expect(result.sequencer.controlParams.some(p => p.name === 'SW')).toBe(true);
    expect(result.sequencer.controlParams.some(p => p.name === 'SEQ MAX')).toBe(true);
    expect(result.sequencer.controlParams.some(p => p.name === 'TARGET')).toBe(false);
    expect(result.sequencer.controlParams.some(p => p.name === 'STEP 1')).toBe(false);
    expect(result.sequencer.stepCount).toBe(16);
    expect(result.sequencer.stepParamNames).toHaveLength(16);
  });

  it('returns multi-target sequencer info for FX with multiple targets', () => {
    const result = handleLookupFxParams({ fx_name: 'LPF' }) as {
      sequencer: {
        targets: Array<{ index: number; param: string }>;
      };
    };
    expect(result.sequencer).not.toBeNull();
    expect(result.sequencer.targets).toHaveLength(2);
    expect(result.sequencer.targets[0]).toEqual(expect.objectContaining({ index: 0, param: 'DEPTH' }));
    expect(result.sequencer.targets[1]).toEqual(expect.objectContaining({ index: 1, param: 'CUTOFF' }));
  });

  it('returns null sequencer for FX without sequencer support', () => {
    const result = handleLookupFxParams({ fx_name: 'REVERB' }) as {
      sequencer: null;
    };
    expect(result.sequencer).toBeNull();
  });
});

describe('handleParseMemory', () => {
  it('parses valid RC0 XML', () => {
    // Minimal test — actual parsing tested in parser tests
    const result = handleParseMemory({ xml: '<rc0></rc0>', slot_number: 1 }) as { config: object };
    expect(result.config).toBeDefined();
  });
});

describe('handleDetectDevice', () => {
  it('returns not-found when no device connected', () => {
    const result = handleDetectDevice() as { mounted: boolean; message: string };
    // In CI/test environments, no device is connected
    expect(typeof result.mounted).toBe('boolean');
    if (!result.mounted) {
      expect(result.message).toContain('not detected');
    }
  });
});

describe('handleGetDeviceSchema', () => {
  it('returns memory_slots = 99', () => {
    const result = handleGetDeviceSchema() as { memory_slots: number };
    expect(result.memory_slots).toBe(99);
  });

  it('returns both IFX and TFX sections with 4 banks each', () => {
    const result = handleGetDeviceSchema() as {
      fx_sections: {
        inputFx: { banks: string[] };
        trackFx: { banks: string[] };
      };
    };
    expect(result.fx_sections.inputFx.banks).toEqual(['A', 'B', 'C', 'D']);
    expect(result.fx_sections.trackFx.banks).toEqual(['A', 'B', 'C', 'D']);
  });

  it('reports 32 total FX positions per slot', () => {
    const result = handleGetDeviceSchema() as { total_fx_positions_per_slot: number };
    expect(result.total_fx_positions_per_slot).toBe(32);
  });

  it('includes mcp_constraints documenting supported banks', () => {
    const result = handleGetDeviceSchema() as {
      mcp_constraints: { tfx_banks_supported: string[] };
    };
    expect(result.mcp_constraints.tfx_banks_supported).toEqual(['A', 'B']);
  });
});

describe('handleEjectDevice', () => {
  it('returns error when no device connected and no path given', () => {
    const result = handleEjectDevice({}) as { error?: string; ejected?: boolean };
    // In CI/test environments, no device is connected
    if (result.error) {
      expect(result.error).toContain('not detected');
    }
  });
});
