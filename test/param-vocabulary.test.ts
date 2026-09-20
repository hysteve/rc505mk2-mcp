/**
 * Guards the contract between the official parameter reference, PARAM_MAP,
 * the transforms, and what lookup_fx_params advertises.
 */
import { describe, it, expect } from 'vitest';
import ref from '../src/data/fx-reference.json' with { type: 'json' };
import { PARAM_MAP } from '../src/params/param-map.js';
import { EFFECT_NAME_MAP } from '../src/params/effect-map.js';
import { TRANSFORM_META } from '../src/mcp/transform-meta.js';
import { resolveParamName } from '../src/params/param-aliases.js';
import { validateSlotParams, resolveEffectName } from '../src/params/validate-params.js';
import { lowCut, highCut, eqFreq, electricScale, snapFreq, parseFreqHz } from '../src/params/transforms.js';
import { FREQ_RANGE } from '../src/fx/fx-values.js';

const reference: Record<string, { params: Record<string, unknown> }> = {
  ...(ref as any).inputAndTrackFx,
  ...(ref as any).trackFxOnly,
};

/**
 * Deliberate deviations from fx-reference.json param names. Each entry needs a reason.
 */
const NAME_ALLOWLIST: Record<string, { onlyInReference?: string[]; onlyInMap?: string[]; reason: string }> = {
  TREMOLO: { onlyInMap: ['LEVEL'], reason: 'Template has a 4th tag (D) the guide does not list; keep until device-checked (QA grid).' },
  STEP_SLICER: {
    onlyInReference: ['STEP LENGTH', 'STEP LEVEL'],
    onlyInMap: [...Array.from({ length: 16 }, (_, i) => `STEP LEN ${i + 1}`), ...Array.from({ length: 16 }, (_, i) => `STEP LVL ${i + 1}`)],
    reason: 'Guide describes one per-step param; RC0 stores 16 of each.',
  },
  TAPE_ECHO: { onlyInReference: ['REPEAT RATE', 'INTENSITY'], onlyInMap: ['TIME', 'FEEDBACK'], reason: 'TAPE ECHO2 in the guide uses different labels for the same two tags; verify labels on device (QA grid).' },
};

describe('fx-reference.json ↔ PARAM_MAP', () => {
  it('every effect in the reference resolves to a PARAM_MAP entry', () => {
    const unresolved = Object.keys(reference).filter(name => !resolveEffectName(name));
    expect(unresolved).toEqual([]);
  });

  it('every non-sequencer PARAM_MAP effect exists in the reference', () => {
    const seen = new Set(Object.keys(reference).map(n => resolveEffectName(n)));
    const missing = Object.keys(PARAM_MAP).filter(k => !k.endsWith('_SEQ') && !seen.has(k));
    expect(missing).toEqual([]);
  });

  it('param names match the reference except for allow-listed deviations', () => {
    const diffs: string[] = [];
    for (const [name, e] of Object.entries(reference)) {
      const rc0 = resolveEffectName(name)!;
      const refP = Object.keys(e.params);
      const mapP = Object.keys(PARAM_MAP[rc0]);
      const allow = NAME_ALLOWLIST[rc0] ?? {};
      const onlyRef = refP.filter(p => !mapP.includes(p) && !allow.onlyInReference?.includes(p));
      const onlyMap = mapP.filter(p => !refP.includes(p) && !allow.onlyInMap?.includes(p));
      if (onlyRef.length || onlyMap.length) diffs.push(`${rc0}: onlyInReference=${onlyRef} onlyInMap=${onlyMap}`);
    }
    expect(diffs).toEqual([]);
  });

  it('legacy effect spellings used by presets resolve', () => {
    for (const name of ['GRANULAR', 'RING MOD', 'LO-FI', 'DISTORTION', 'GATE REVERB', 'REVERSE REVERB', 'OSC VOC', 'HRM AUTO']) {
      expect(resolveEffectName(name), name).toBeDefined();
    }
  });
});

describe('TRANSFORM_META enums are in RC0 index order', () => {
  const byTransform = new Map<Function, { effect: string; param: string }>();
  for (const [effect, params] of Object.entries(PARAM_MAP)) {
    for (const [param, def] of Object.entries(params)) {
      if (def.transform && !byTransform.has(def.transform)) byTransform.set(def.transform, { effect, param });
    }
  }

  for (const [transform, meta] of TRANSFORM_META) {
    if (!transform || meta.type !== 'enum') continue;
    const use = byTransform.get(transform);
    const label = use ? `${use.effect}.${use.param}` : transform.name;

    it(`${label}: forward transform maps values[i] → i`, () => {
      const bad = meta.values.map((v, i) => [v, i, transform(v)]).filter(([, i, out]) => out !== i);
      expect(bad).toEqual([]);
    });

    if (use) {
      const rev = PARAM_MAP[use.effect][use.param].reverse!;
      it(`${label}: reverse transform maps i → values[i]`, () => {
        const bad = meta.values.map((v, i) => [v, i, rev(i)]).filter(([v, , out]) => out !== v);
        expect(bad).toEqual([]);
      });
    }

    if (meta.aliases && !meta.values.some(v => v.includes('Hz'))) {
      it(`${label}: every alias is accepted by the transform`, () => {
        for (const alias of meta.aliases!) {
          const out = transform(alias);
          expect(meta.values[out], alias).toBeDefined();
          expect(Number.isNaN(out)).toBe(false);
        }
      });
    }
  }

  it('every transform used by PARAM_MAP has metadata (so lookup_fx_params can describe it)', () => {
    const missing = [...byTransform.entries()].filter(([t]) => !TRANSFORM_META.has(t)).map(([, u]) => `${u.effect}.${u.param}`);
    expect(missing).toEqual([]);
  });
});

describe('param aliases', () => {
  it('EQ legacy names resolve to reference names', () => {
    expect(resolveParamName('EQ', 'LO GAIN')).toBe('LO');
    expect(resolveParamName('EQ', 'HI GAIN')).toBe('HIGH');
    expect(resolveParamName('EQ', 'lo')).toBe('LO');
    expect(resolveParamName('EQ', 'HI-MID FREQ')).toBe('HI-MID FREQ');
  });
  it('unknown names pass through upper-cased', () => {
    expect(resolveParamName('EQ', 'Sparkle')).toBe('SPARKLE');
  });
});

describe('frequency parsing and snapping', () => {
  it('parses human frequency strings', () => {
    expect(parseFreqHz('2.5 kHz')).toBe(2500);
    expect(parseFreqHz('2.50k Hz')).toBe(2500);
    expect(parseFreqHz('150 Hz')).toBe(150);
    expect(parseFreqHz('1k')).toBe(1000);
    expect(parseFreqHz('2500')).toBe(2500);
    expect(parseFreqHz('FLAT')).toBeNull();
  });
  it('snaps to the nearest device step', () => {
    expect(snapFreq('2.5 kHz')).toBe('2.50 kHz');
    expect(snapFreq('3 kHz')).toBe('3.15 kHz');
    expect(snapFreq('150 Hz')).toBe('160 Hz');
    expect(snapFreq('8000')).toBe('8.00 kHz');
    expect(snapFreq('1 kHz')).toBe('1.00 kHz');
  });
  it('lowCut/highCut/eqFreq accept snapped values and exact strings alike', () => {
    expect(lowCut('2.5 kHz')).toBe(lowCut('2.50 kHz'));
    expect(highCut('8 kHz')).toBe(highCut('8.00 kHz'));
    expect(eqFreq('3 kHz')).toBe(FREQ_RANGE.indexOf('3.15 kHz'));
    expect(lowCut('FLAT')).toBe(0);
    expect(highCut('FLAT')).toBe(29);
  });
  it('bare numbers above the index range are treated as Hz', () => {
    expect(lowCut('200')).toBe(1 + FREQ_RANGE.indexOf('200 Hz'));
    expect(highCut('8000')).toBe(FREQ_RANGE.indexOf('8.00 kHz'));
    expect(highCut('12')).toBe(12); // small bare integer keeps raw-index behaviour
  });
  it('ELECTRIC SCALE accepts the guide spelling with relative minor', () => {
    expect(electricScale('C (Am)')).toBe(electricScale('C'));
    expect(electricScale('EB (Cm)')).toBe(electricScale('EB'));
    expect(electricScale('CHROMATIC')).toBe(0);
  });
});

describe('validateSlotParams', () => {
  it('accepts a fully valid slot', () => {
    const { effect, issues } = validateSlotParams('REVERB', [
      { name: 'TIME', value: '2.2' }, { name: 'PRE DELAY', value: '20' }, { name: 'DENSITY', value: '7' },
      { name: 'D.LEVEL', value: '65' }, { name: 'LOW CUT', value: '160 Hz' }, { name: 'HIGH CUT', value: '8 kHz' }, { name: 'E.LEVEL', value: '100' },
    ]);
    expect(effect).toBe('REVERB');
    expect(issues).toEqual([]);
  });
  it('flags unknown effect as error', () => {
    const { issues } = validateSlotParams('SPARKLE', []);
    expect(issues[0]).toMatchObject({ level: 'error', kind: 'unknown-effect' });
  });
  it('flags unknown param, bad enum, raw index, out of range, and note-value rate', () => {
    const { issues } = validateSlotParams('LPF', [
      { name: 'E.LEVEL', value: '100' },
      { name: 'RATE', value: '1/4' },
      { name: 'CUTOFF', value: '150' },
    ]);
    expect(issues.map(i => i.kind)).toEqual(['unknown-param', 'unsupported-note-value', 'out-of-range']);
    const dyn = validateSlotParams('DYNAMICS', [{ name: 'TYPE', value: 'LIMITER' }]);
    expect(dyn.issues[0]).toMatchObject({ kind: 'unrecognized-value' });
    const eq = validateSlotParams('EQ', [{ name: 'LO-MID Q', value: '3' }]);
    expect(eq.issues[0]).toMatchObject({ kind: 'enum-index' });
  });
  it('accepts transform aliases and EQ legacy names without complaint', () => {
    expect(validateSlotParams('PREAMP', [{ name: 'MIC TYPE', value: 'DYN57' }]).issues).toEqual([]);
    expect(validateSlotParams('EQ', [{ name: 'LO GAIN', value: '3' }, { name: 'HIGH', value: '-2' }]).issues).toEqual([]);
    expect(validateSlotParams('LPF', [{ name: 'STEP RATE', value: 'OFF' }]).issues).toEqual([]);
  });
});
