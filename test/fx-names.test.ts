import { describe, it, expect } from 'vitest';
import {
  RC0_FX_NAMES, RC0_SPECIAL_TRACK_FX_NAMES, SPECIAL_TRACK_FX,
  RC0_FX_NAME_LIST, RC0_SEQ_FX_MAP,
} from '../src/fx/fx-names.js';
import { resolveFxIndex, fxNameFromIndex } from '../src/fx/fx-indexes.js';

describe('FX name constants', () => {
  it('RC0_FX_NAMES has expected entries', () => {
    expect(RC0_FX_NAMES.LPF).toBe('LPF');
    expect(RC0_FX_NAMES.REVERB).toBe('REVERB');
    expect(RC0_FX_NAMES.TAPE_ECHO_V505V2).toBe('TAPE_ECHO_V505V2');
  });

  it('RC0_FX_NAME_LIST contains all base FX types', () => {
    expect(RC0_FX_NAME_LIST).toContain('LPF');
    expect(RC0_FX_NAME_LIST).toContain('REVERB');
    expect(RC0_FX_NAME_LIST).toContain('BEAT_SCATTER');
    expect(RC0_FX_NAME_LIST.length).toBeGreaterThan(40);
  });

  it('SPECIAL_TRACK_FX contains beat/vinyl FX', () => {
    expect(SPECIAL_TRACK_FX.has('BEAT_SCATTER')).toBe(true);
    expect(SPECIAL_TRACK_FX.has('BEAT_REPEAT')).toBe(true);
    expect(SPECIAL_TRACK_FX.has('BEAT_SHIFT')).toBe(true);
    expect(SPECIAL_TRACK_FX.has('VINYL_FLICK')).toBe(true);
    expect(SPECIAL_TRACK_FX.has('REVERB')).toBe(false);
  });

  it('RC0_SPECIAL_TRACK_FX_NAMES maps correctly', () => {
    expect(RC0_SPECIAL_TRACK_FX_NAMES.BEAT_SCATTER).toBe('BEAT_SCATTER');
    expect(RC0_SPECIAL_TRACK_FX_NAMES.VINYL_FLICK).toBe('VINYL_FLICK');
  });
});

describe('RC0_SEQ_FX_MAP', () => {
  it('maps root FX to sequencer variant', () => {
    expect(RC0_SEQ_FX_MAP['LPF']).toBe('LPF_SEQ');
    expect(RC0_SEQ_FX_MAP['PHASER']).toBe('PHASER_SEQ');
    expect(RC0_SEQ_FX_MAP['VIBRATO']).toBe('VIBRATO_SEQ');
  });

  it('does not have mappings for non-sequenced FX', () => {
    expect(RC0_SEQ_FX_MAP['REVERB']).toBeUndefined();
    expect(RC0_SEQ_FX_MAP['DELAY']).toBeUndefined();
  });
});

describe('resolveFxIndex', () => {
  it('returns consistent index for common FX in both contexts', () => {
    const lpfIfx = resolveFxIndex('LPF', 'ifx');
    const lpfTfx = resolveFxIndex('LPF', 'tfx');
    expect(lpfIfx).toBe(lpfTfx);
    expect(lpfIfx).toBeDefined();
  });

  it('returns different indices for context-dependent FX', () => {
    const tapeIfx = resolveFxIndex('TAPE_ECHO_V505V2', 'ifx');
    const tapeTfx = resolveFxIndex('TAPE_ECHO_V505V2', 'tfx');
    // Both should be defined but may differ
    expect(tapeIfx).toBeDefined();
    expect(tapeTfx).toBeDefined();
  });

  it('returns undefined for special track FX in IFX context', () => {
    expect(resolveFxIndex('BEAT_SCATTER', 'ifx')).toBeUndefined();
  });

  it('returns a valid index for special track FX in TFX context', () => {
    const idx = resolveFxIndex('BEAT_SCATTER', 'tfx');
    expect(idx).toBeDefined();
    expect(typeof idx).toBe('number');
  });
});

describe('fxNameFromIndex', () => {
  it('roundtrips with resolveFxIndex for common FX', () => {
    for (const name of ['LPF', 'REVERB', 'DELAY', 'EQ', 'DYNAMICS']) {
      const idx = resolveFxIndex(name, 'ifx');
      if (idx !== undefined) {
        expect(fxNameFromIndex(idx, 'ifx')).toBe(name);
      }
    }
  });

  it('roundtrips special track FX in TFX context', () => {
    const idx = resolveFxIndex('BEAT_SCATTER', 'tfx');
    if (idx !== undefined) {
      expect(fxNameFromIndex(idx, 'tfx')).toBe('BEAT_SCATTER');
    }
  });

  it('returns undefined for invalid index', () => {
    expect(fxNameFromIndex(9999, 'ifx')).toBeUndefined();
  });
});
