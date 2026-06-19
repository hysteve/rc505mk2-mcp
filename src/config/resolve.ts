/**
 * Config inheritance resolution — resolves FxModule → Rack → MemoryConfig
 * hierarchical params by merging base module defaults with per-slot overrides.
 *
 * Resolution produces the full param set needed for generation and display.
 * Stored configs retain fxModuleId + overrides for inheritance tracking.
 */

import type { FxParam } from '../schemas/fx-param.js';
import type { FxSlotData, Rack } from '../schemas/rack.js';
import type { FxModule } from '../schemas/fx-module.js';
import type {
  MemoryConfig,
  MemoryFxSection,
  MemoryFxSlot,
} from '../schemas/memory-config.js';

/**
 * Merge base params with overrides. Override values replace base values
 * by param name; base params not in overrides are preserved.
 * Params in overrides that don't exist in base are appended.
 */
export function mergeParams(base: FxParam[], overrides: FxParam[]): FxParam[] {
  if (!overrides.length) return [...base];

  const overrideMap = new Map(overrides.map((p) => [p.name, p.value]));
  const seen = new Set<string>();

  const merged = base.map((p) => {
    seen.add(p.name);
    return {
      name: p.name,
      value: overrideMap.get(p.name) ?? p.value,
    };
  });

  // Append any override params not present in base (forward-compatibility)
  for (const p of overrides) {
    if (!seen.has(p.name)) {
      merged.push({ name: p.name, value: p.value });
    }
  }

  return merged;
}

/**
 * Resolve a slot's effective params given its source module.
 * Returns the full param set: module defaults + slot overrides.
 * If no module reference or module not found, returns slot.params as-is.
 */
export function resolveSlotParams(
  slot: FxSlotData | MemoryFxSlot,
  getModule: (id: string) => FxModule | undefined,
): FxParam[] {
  if (!slot.fxModuleId) return slot.params;
  const module = getModule(slot.fxModuleId);
  if (!module) return slot.params; // module deleted — frozen params
  return mergeParams(module.params, slot.overrides ?? []);
}

/**
 * Compute overrides: given a module and the user's desired params,
 * return only the params that differ from the module defaults.
 */
export function computeOverrides(
  moduleParams: FxParam[],
  desiredParams: FxParam[],
): FxParam[] {
  const baseMap = new Map(moduleParams.map((p) => [p.name, p.value]));
  return desiredParams.filter((p) => baseMap.get(p.name) !== p.value);
}

/**
 * Build a resolved copy of FxSlotData with fully expanded params.
 * The returned slot has params fully resolved and overrides cleared,
 * suitable for passing to the generator.
 */
export function resolveSlot(
  slot: FxSlotData,
  getModule: (id: string) => FxModule | undefined,
): FxSlotData {
  const params = resolveSlotParams(slot, getModule);
  return { ...slot, params };
}

/**
 * Check whether a param in a slot is inherited (from the module)
 * vs overridden (slot-specific). Useful for UI display.
 */
export function isParamOverridden(
  slot: FxSlotData | MemoryFxSlot,
  paramName: string,
): boolean {
  if (!slot.fxModuleId || !slot.overrides) return false;
  return slot.overrides.some((p) => p.name === paramName);
}

/**
 * Given a slot with a module reference and fully resolved params,
 * recompute and return the minimal overrides set.
 * Useful after the user edits params in the UI.
 */
export function recomputeSlotOverrides(
  slot: FxSlotData | MemoryFxSlot,
  getModule: (id: string) => FxModule | undefined,
): FxParam[] {
  if (!slot.fxModuleId) return [];
  const module = getModule(slot.fxModuleId);
  if (!module) return [];
  return computeOverrides(module.params, slot.params);
}

function resolveMemorySection(
  section: MemoryFxSection,
  getModule: (id: string) => FxModule | undefined,
): MemoryFxSection {
  return {
    ...section,
    banks: section.banks.map(bank => ({
      ...bank,
      slots: bank.slots.map(slot => ({
        ...slot,
        params: resolveSlotParams(slot, getModule),
      })),
    })),
  };
}

/** Expand fxModuleId inheritance across all slots in a MemoryConfig. */
export function resolveMemoryConfig(
  config: MemoryConfig,
  getModule: (id: string) => FxModule | undefined,
): MemoryConfig {
  return {
    ...config,
    inputFx: resolveMemorySection(config.inputFx, getModule),
    trackFx: resolveMemorySection(config.trackFx, getModule),
  };
}

/** Expand fxModuleId inheritance in a rack preset. */
export function resolveRackPreset(
  rack: Rack,
  getModule: (id: string) => FxModule | undefined,
): Rack {
  return {
    ...rack,
    inputFx: rack.inputFx.map(slot => resolveSlot(slot, getModule)),
    trackFx: rack.trackFx.map(slot => resolveSlot(slot, getModule)),
  };
}
