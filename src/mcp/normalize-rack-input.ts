/**
 * Normalize create/update rack preset args before Zod validation.
 * Fills effect from fxModuleId; defaults params to []; coerces param types.
 */

import type { PresetStore } from '../stores/preset-store.js';

type SlotRecord = Record<string, unknown>;
type ParamRecord = { name: string; value: string };

function coerceParamList(value: unknown): ParamRecord[] | undefined {
  if (value == null) return undefined;
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((p): p is Record<string, unknown> => p != null && typeof p === 'object' && !Array.isArray(p))
    .filter(p => typeof p.name === 'string' && p.name.length > 0)
    .map(p => ({
      name: p.name as string,
      value: p.value == null ? '' : String(p.value),
    }));
}

function normalizeSequencer(value: unknown): ParamRecord[] | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) return coerceParamList(value);
  // LLMs often send {} when no sequencer — omit rather than fail validation
  return undefined;
}

function normalizeSlot(
  slot: SlotRecord,
  store: PresetStore,
): SlotRecord {
  const out = { ...slot };
  const moduleId = out.fxModuleId;

  if (typeof moduleId === 'string' && moduleId.length > 0) {
    const mod = store.getModuleById(moduleId);
    if (mod && (out.effect == null || out.effect === '')) {
      out.effect = mod.effect;
    }
  }

  if (out.params === undefined) {
    out.params = [];
  } else {
    out.params = coerceParamList(out.params) ?? [];
  }

  if ('overrides' in out) {
    const overrides = coerceParamList(out.overrides);
    if (overrides === undefined) delete out.overrides;
    else out.overrides = overrides;
  }

  if ('sequencer' in out) {
    const sequencer = normalizeSequencer(out.sequencer);
    if (sequencer === undefined) delete out.sequencer;
    else out.sequencer = sequencer;
  }

  return out;
}

function normalizeSlotList(
  slots: unknown,
  store: PresetStore,
): unknown {
  if (!Array.isArray(slots)) return slots;
  return slots.map(s =>
    s && typeof s === 'object' ? normalizeSlot(s as SlotRecord, store) : s,
  );
}

/** Apply fxModuleId inference and param defaults to rack preset tool input. */
export function normalizeRackPresetArgs(
  args: Record<string, unknown>,
  store: PresetStore,
): Record<string, unknown> {
  return {
    ...args,
    inputFx: normalizeSlotList(args.inputFx, store),
    trackFx: normalizeSlotList(args.trackFx, store),
  };
}
