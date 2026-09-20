/**
 * Shared param validation — the single place that answers "would this param
 * survive generation unchanged?". Used by the preset audit script, the MCP
 * handlers, and tests.
 *
 * Everything here mirrors what the generator actually does: unknown params are
 * skipped, enum transforms fall back to num(), numeric transforms clamp. The
 * validator reports those outcomes instead of letting them happen silently.
 */

import type { FxParam } from '../schemas/fx-param.js';
import { PARAM_MAP } from './param-map.js';
import { EFFECT_NAME_MAP } from './effect-map.js';
import { resolveParamName } from './param-aliases.js';
import { num, rateValue, stepRateValue, snapFreq, lowCut, highCut, eqFreq } from './transforms.js';
import { TRANSFORM_META } from '../mcp/transform-meta.js';
import { RATE_NOTE_VALUES } from '../fx/fx-values.js';

export type ParamIssueKind =
  | 'unknown-effect'
  | 'unknown-param'
  | 'unrecognized-value'
  | 'enum-index'
  | 'out-of-range'
  | 'unsupported-note-value';

export interface ParamIssue {
  level: 'error' | 'warning';
  kind: ParamIssueKind;
  param?: string;
  value?: string;
  /** What the generator would write / do. */
  outcome: string;
  /** Human-readable explanation with the accepted values inline. */
  message: string;
  /** Best guess at what the author meant, when one can be made. */
  suggestion?: string;
}

export interface ParamValidation {
  /** Resolved RC0 effect name, or undefined when the effect is unknown. */
  effect?: string;
  issues: ParamIssue[];
}

const FREQ_TRANSFORMS = new Set<unknown>([lowCut, highCut, eqFreq]);
const RATE_TRANSFORMS = new Set<unknown>([rateValue, stepRateValue]);
const NOTE_LIKE = new Set([...RATE_NOTE_VALUES, '4MEAS', '2MEAS', '1MEAS'].map(v => v.toUpperCase()));

const norm = (s: string) => s.toUpperCase().replace(/[\s._-]+/g, '');
const isNumeric = (v: string) => /^-?\d+(\.\d+)?$/.test(v.trim());

/** Resolve a display/user effect name to its RC0 name, or undefined. */
export function resolveEffectName(effect: string): string | undefined {
  const key = effect.toUpperCase().trim();
  const rc0 = EFFECT_NAME_MAP[key] ?? key.replace(/[\s-]+/g, '_');
  return PARAM_MAP[rc0] ? rc0 : undefined;
}

function listValues(values: string[], max = 8): string {
  return values.length > max ? `${values.slice(0, max).join(', ')}, … (${values.length} total)` : values.join(', ');
}

/** Nearest enum value by normalized prefix/substring match. */
function suggestEnum(values: string[], value: string): string | undefined {
  const n = norm(value);
  if (!n) return undefined;
  const exact = values.find(v => norm(v) === n);
  if (exact) return exact;
  const starts = values.find(v => norm(v).startsWith(n) || n.startsWith(norm(v)));
  if (starts) return starts;
  return values.find(v => norm(v).includes(n) || n.includes(norm(v)));
}

/**
 * Validate one FX slot's params for the given effect. `effect` may be a display
 * name ("GATE REVERB") or RC0 name ("GATE_REVERB").
 */
export function validateSlotParams(effect: string, params: readonly FxParam[]): ParamValidation {
  const rc0 = resolveEffectName(effect);
  if (!rc0) {
    return {
      issues: [{
        level: 'error',
        kind: 'unknown-effect',
        value: effect,
        outcome: 'slot skipped entirely',
        message: `Unknown effect "${effect}". Use list_fx_types for the accepted names.`,
      }],
    };
  }

  const defs = PARAM_MAP[rc0];
  const issues: ParamIssue[] = [];

  for (const p of params) {
    const name = resolveParamName(rc0, p.name);
    const def = defs[name];
    const value = String(p.value);

    if (!def) {
      issues.push({
        level: 'warning',
        kind: 'unknown-param',
        param: p.name,
        value,
        outcome: 'ignored (device keeps its default)',
        message: `${rc0} has no param "${p.name}". Accepted: ${Object.keys(defs).join(', ')}.`,
        suggestion: suggestEnum(Object.keys(defs), p.name),
      });
      continue;
    }

    const meta = TRANSFORM_META.get(def.transform);
    const out = def.transform ? def.transform(value) : num(value);

    if (meta?.type === 'enum') {
      const idx = meta.values.findIndex(v => norm(v) === norm(value));
      if (idx !== -1) continue;

      if (isNumeric(value)) {
        // Frequency params: bare numbers > 29 are treated as Hz and snapped (see freqIndex).
        if (FREQ_TRANSFORMS.has(def.transform) && parseFloat(value) > 29) continue;
        issues.push({
          level: 'warning',
          kind: 'enum-index',
          param: name,
          value,
          outcome: `stored as index ${out} = "${meta.values[out] ?? 'out of range'}"`,
          message: `${rc0}.${name} is an enum; "${value}" is used as a raw index, not a value. Accepted: ${listValues(meta.values)}.`,
        });
        continue;
      }

      if (FREQ_TRANSFORMS.has(def.transform)) {
        const snapped = snapFreq(value);
        if (snapped && norm(meta.values[out] ?? '') === norm(snapped)) continue; // accepted via snapping
      }

      // Enum transforms fall back to num() (→ 0) for anything they don't know, which is
      // indistinguishable from a legitimate index-0 alias. Recognition is therefore
      // membership in the documented values + aliases; test/param-vocabulary.test.ts
      // keeps that list honest against the transforms.
      const known = [...meta.values, ...(meta.aliases ?? [])].some(v => norm(v) === norm(value));
      if (!known) {
        issues.push({
          level: 'warning',
          kind: 'unrecognized-value',
          param: name,
          value,
          outcome: `coerced to ${out} = "${meta.values[out] ?? '?'}"`,
          message: `"${value}" is not a recognized ${rc0}.${name} value. Accepted: ${listValues(meta.values)}.`,
          suggestion: suggestEnum(meta.values, value),
        });
      }
      // else: alias accepted by the transform — fine
      continue;
    }

    if (meta?.type === 'numeric') {
      if (meta.noteValues?.some(v => v.toUpperCase() === value.toUpperCase())) continue;

      if (!isNumeric(value)) {
        if (RATE_TRANSFORMS.has(def.transform) && value.toUpperCase() === 'OFF') continue; // OFF = 0
        if (RATE_TRANSFORMS.has(def.transform) && NOTE_LIKE.has(value.toUpperCase().replace(/\s+/g, ''))) {
          issues.push({
            level: 'warning',
            kind: 'unsupported-note-value',
            param: name,
            value,
            outcome: `coerced to ${out}`,
            message: `${rc0}.${name}: tempo-synced values (${value}) are not encoded yet — the RC0 encoding is pending device verification. Use a numeric rate 0-100 for now.`,
          });
          continue;
        }
        issues.push({
          level: 'warning',
          kind: 'unrecognized-value',
          param: name,
          value,
          outcome: `coerced to ${out}`,
          message: `${rc0}.${name} expects ${meta.range.min}–${meta.range.max}${meta.unit ? ' ' + meta.unit : ''}${meta.noteValues ? ' or a note value (' + meta.noteValues.join(', ') + ')' : ''}; got "${value}".`,
        });
        continue;
      }

      const n = parseFloat(value);
      if (n < meta.range.min || n > meta.range.max) {
        issues.push({
          level: 'warning',
          kind: 'out-of-range',
          param: name,
          value,
          outcome: `clamped to RC0 ${out}`,
          message: `${rc0}.${name} = ${value} is outside ${meta.range.min}–${meta.range.max}${meta.unit ? ' ' + meta.unit : ''}.`,
          suggestion: String(Math.max(meta.range.min, Math.min(meta.range.max, n))),
        });
      }
    }
  }

  return { effect: rc0, issues };
}
