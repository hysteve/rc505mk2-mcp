/**
 * Tests for config inheritance resolution — Phase 3 of the config system plan.
 *
 * Covers: mergeParams, resolveSlotParams, computeOverrides, resolveSlot,
 * isParamOverridden, recomputeSlotOverrides, and multi-level inheritance scenarios.
 */

import { describe, it, expect } from 'vitest';
import {
  mergeParams,
  resolveSlotParams,
  computeOverrides,
  resolveSlot,
  isParamOverridden,
  recomputeSlotOverrides,
} from '../src/config/resolve.js';
import type { FxParam } from '../src/schemas/fx-param.js';
import type { FxSlotData } from '../src/schemas/rack.js';
import type { FxModule } from '../src/schemas/fx-module.js';
import type { MemoryFxSlot } from '../src/schemas/memory-config.js';

// ── Test Fixtures ────────────────────────────────────────────────────

function makeModule(
  id: string,
  effect: string,
  params: FxParam[],
): FxModule {
  return {
    id,
    effect,
    title: `Test ${effect}`,
    category: 'test',
    context: ['ifx'],
    usage: 'both',
    description: '',
    params,
  };
}

function makeSlot(overrides: Partial<FxSlotData> = {}): FxSlotData {
  return {
    slot: 'A',
    effect: 'REVERB',
    params: [],
    ...overrides,
  };
}

function makeMemorySlot(overrides: Partial<MemoryFxSlot> = {}): MemoryFxSlot {
  return {
    slot: 'A',
    effect: 'REVERB',
    params: [],
    ...overrides,
  };
}

const REVERB_MODULE = makeModule('hall-wash', 'REVERB', [
  { name: 'TYPE', value: 'HALL1' },
  { name: 'TIME', value: '5.0' },
  { name: 'LEVEL', value: '80' },
  { name: 'PRE_DELAY', value: '10' },
]);

const COMP_MODULE = makeModule('gentle-comp', 'NATURALCOMP', [
  { name: 'TYPE', value: 'NATURALCOMP' },
  { name: 'SUSTAIN', value: '50' },
  { name: 'ATTACK', value: '30' },
  { name: 'LEVEL', value: '100' },
]);

function moduleStore(
  modules: FxModule[],
): (id: string) => FxModule | undefined {
  const map = new Map(modules.map((m) => [m.id, m]));
  return (id: string) => map.get(id);
}

// ── mergeParams ──────────────────────────────────────────────────────

describe('mergeParams', () => {
  it('returns base copy when overrides are empty', () => {
    const base: FxParam[] = [
      { name: 'TYPE', value: 'HALL1' },
      { name: 'TIME', value: '5.0' },
    ];
    const result = mergeParams(base, []);
    expect(result).toEqual(base);
    // Verify it's a copy, not the same reference
    expect(result).not.toBe(base);
  });

  it('overrides matching params by name', () => {
    const base: FxParam[] = [
      { name: 'TYPE', value: 'HALL1' },
      { name: 'TIME', value: '5.0' },
      { name: 'LEVEL', value: '80' },
    ];
    const overrides: FxParam[] = [{ name: 'TIME', value: '3.0' }];
    const result = mergeParams(base, overrides);
    expect(result).toEqual([
      { name: 'TYPE', value: 'HALL1' },
      { name: 'TIME', value: '3.0' },
      { name: 'LEVEL', value: '80' },
    ]);
  });

  it('overrides multiple params', () => {
    const base: FxParam[] = [
      { name: 'TYPE', value: 'HALL1' },
      { name: 'TIME', value: '5.0' },
      { name: 'LEVEL', value: '80' },
    ];
    const overrides: FxParam[] = [
      { name: 'TIME', value: '2.0' },
      { name: 'LEVEL', value: '60' },
    ];
    const result = mergeParams(base, overrides);
    expect(result).toEqual([
      { name: 'TYPE', value: 'HALL1' },
      { name: 'TIME', value: '2.0' },
      { name: 'LEVEL', value: '60' },
    ]);
  });

  it('preserves base param order', () => {
    const base: FxParam[] = [
      { name: 'A', value: '1' },
      { name: 'B', value: '2' },
      { name: 'C', value: '3' },
    ];
    const overrides: FxParam[] = [{ name: 'C', value: '99' }];
    const result = mergeParams(base, overrides);
    expect(result.map((p) => p.name)).toEqual(['A', 'B', 'C']);
  });

  it('appends override params not present in base', () => {
    const base: FxParam[] = [{ name: 'TYPE', value: 'HALL1' }];
    const overrides: FxParam[] = [{ name: 'NEW_PARAM', value: '42' }];
    const result = mergeParams(base, overrides);
    expect(result).toEqual([
      { name: 'TYPE', value: 'HALL1' },
      { name: 'NEW_PARAM', value: '42' },
    ]);
  });

  it('handles empty base', () => {
    const overrides: FxParam[] = [{ name: 'TYPE', value: 'HALL1' }];
    const result = mergeParams([], overrides);
    expect(result).toEqual([{ name: 'TYPE', value: 'HALL1' }]);
  });

  it('handles both empty', () => {
    expect(mergeParams([], [])).toEqual([]);
  });
});

// ── resolveSlotParams ────────────────────────────────────────────────

describe('resolveSlotParams', () => {
  const getModule = moduleStore([REVERB_MODULE, COMP_MODULE]);

  it('returns slot.params when no fxModuleId is set', () => {
    const slot = makeSlot({
      params: [{ name: 'TYPE', value: 'ROOM1' }],
    });
    const result = resolveSlotParams(slot, getModule);
    expect(result).toEqual([{ name: 'TYPE', value: 'ROOM1' }]);
  });

  it('returns full module params when fxModuleId set with no overrides', () => {
    const slot = makeSlot({
      fxModuleId: 'hall-wash',
      params: [], // will be resolved from module
    });
    const result = resolveSlotParams(slot, getModule);
    expect(result).toEqual(REVERB_MODULE.params);
  });

  it('merges module params with slot overrides', () => {
    const slot = makeSlot({
      fxModuleId: 'hall-wash',
      params: [],
      overrides: [{ name: 'TIME', value: '3.0' }],
    });
    const result = resolveSlotParams(slot, getModule);
    expect(result).toEqual([
      { name: 'TYPE', value: 'HALL1' },
      { name: 'TIME', value: '3.0' },
      { name: 'LEVEL', value: '80' },
      { name: 'PRE_DELAY', value: '10' },
    ]);
  });

  it('falls back to slot.params when module not found', () => {
    const frozenParams = [
      { name: 'TYPE', value: 'HALL1' },
      { name: 'TIME', value: '5.0' },
    ];
    const slot = makeSlot({
      fxModuleId: 'deleted-module',
      params: frozenParams,
    });
    const result = resolveSlotParams(slot, getModule);
    expect(result).toEqual(frozenParams);
  });

  it('works with MemoryFxSlot type', () => {
    const slot = makeMemorySlot({
      fxModuleId: 'gentle-comp',
      params: [],
      overrides: [{ name: 'SUSTAIN', value: '70' }],
    });
    const result = resolveSlotParams(slot, getModule);
    expect(result).toEqual([
      { name: 'TYPE', value: 'NATURALCOMP' },
      { name: 'SUSTAIN', value: '70' },
      { name: 'ATTACK', value: '30' },
      { name: 'LEVEL', value: '100' },
    ]);
  });

  it('handles empty overrides array (all inherited)', () => {
    const slot = makeSlot({
      fxModuleId: 'hall-wash',
      params: [],
      overrides: [],
    });
    const result = resolveSlotParams(slot, getModule);
    expect(result).toEqual(REVERB_MODULE.params);
  });
});

// ── computeOverrides ─────────────────────────────────────────────────

describe('computeOverrides', () => {
  it('returns empty when desired matches module exactly', () => {
    const result = computeOverrides(REVERB_MODULE.params, [
      { name: 'TYPE', value: 'HALL1' },
      { name: 'TIME', value: '5.0' },
      { name: 'LEVEL', value: '80' },
      { name: 'PRE_DELAY', value: '10' },
    ]);
    expect(result).toEqual([]);
  });

  it('returns only changed params', () => {
    const result = computeOverrides(REVERB_MODULE.params, [
      { name: 'TYPE', value: 'HALL1' },
      { name: 'TIME', value: '3.0' },
      { name: 'LEVEL', value: '80' },
      { name: 'PRE_DELAY', value: '20' },
    ]);
    expect(result).toEqual([
      { name: 'TIME', value: '3.0' },
      { name: 'PRE_DELAY', value: '20' },
    ]);
  });

  it('returns all params when everything is overridden', () => {
    const desired: FxParam[] = [
      { name: 'TYPE', value: 'ROOM1' },
      { name: 'TIME', value: '1.0' },
      { name: 'LEVEL', value: '50' },
      { name: 'PRE_DELAY', value: '0' },
    ];
    const result = computeOverrides(REVERB_MODULE.params, desired);
    expect(result).toEqual(desired);
  });

  it('includes new params not in module', () => {
    const desired: FxParam[] = [
      ...REVERB_MODULE.params,
      { name: 'NEW_PARAM', value: '42' },
    ];
    const result = computeOverrides(REVERB_MODULE.params, desired);
    expect(result).toEqual([{ name: 'NEW_PARAM', value: '42' }]);
  });

  it('handles empty module params', () => {
    const desired: FxParam[] = [{ name: 'TYPE', value: 'HALL1' }];
    const result = computeOverrides([], desired);
    expect(result).toEqual(desired);
  });

  it('handles empty desired params', () => {
    const result = computeOverrides(REVERB_MODULE.params, []);
    expect(result).toEqual([]);
  });
});

// ── resolveSlot ──────────────────────────────────────────────────────

describe('resolveSlot', () => {
  const getModule = moduleStore([REVERB_MODULE]);

  it('returns slot with resolved params', () => {
    const slot = makeSlot({
      fxModuleId: 'hall-wash',
      params: [],
      overrides: [{ name: 'TIME', value: '3.0' }],
      label: 'My Reverb',
    });
    const resolved = resolveSlot(slot, getModule);
    expect(resolved.params).toEqual([
      { name: 'TYPE', value: 'HALL1' },
      { name: 'TIME', value: '3.0' },
      { name: 'LEVEL', value: '80' },
      { name: 'PRE_DELAY', value: '10' },
    ]);
    // Preserves other fields
    expect(resolved.label).toBe('My Reverb');
    expect(resolved.fxModuleId).toBe('hall-wash');
    expect(resolved.slot).toBe('A');
  });

  it('preserves slot without module reference', () => {
    const slot = makeSlot({
      params: [{ name: 'TYPE', value: 'ROOM1' }],
    });
    const resolved = resolveSlot(slot, getModule);
    expect(resolved.params).toEqual([{ name: 'TYPE', value: 'ROOM1' }]);
  });
});

// ── isParamOverridden ────────────────────────────────────────────────

describe('isParamOverridden', () => {
  it('returns false when no fxModuleId', () => {
    const slot = makeSlot({ params: [{ name: 'TYPE', value: 'HALL1' }] });
    expect(isParamOverridden(slot, 'TYPE')).toBe(false);
  });

  it('returns false when no overrides', () => {
    const slot = makeSlot({ fxModuleId: 'hall-wash', params: [] });
    expect(isParamOverridden(slot, 'TYPE')).toBe(false);
  });

  it('returns false for inherited param', () => {
    const slot = makeSlot({
      fxModuleId: 'hall-wash',
      params: [],
      overrides: [{ name: 'TIME', value: '3.0' }],
    });
    expect(isParamOverridden(slot, 'TYPE')).toBe(false);
  });

  it('returns true for overridden param', () => {
    const slot = makeSlot({
      fxModuleId: 'hall-wash',
      params: [],
      overrides: [{ name: 'TIME', value: '3.0' }],
    });
    expect(isParamOverridden(slot, 'TIME')).toBe(true);
  });

  it('works with MemoryFxSlot', () => {
    const slot = makeMemorySlot({
      fxModuleId: 'gentle-comp',
      params: [],
      overrides: [{ name: 'SUSTAIN', value: '70' }],
    });
    expect(isParamOverridden(slot, 'SUSTAIN')).toBe(true);
    expect(isParamOverridden(slot, 'ATTACK')).toBe(false);
  });
});

// ── recomputeSlotOverrides ───────────────────────────────────────────

describe('recomputeSlotOverrides', () => {
  const getModule = moduleStore([REVERB_MODULE, COMP_MODULE]);

  it('returns empty when no fxModuleId', () => {
    const slot = makeSlot({
      params: [{ name: 'TYPE', value: 'ROOM1' }],
    });
    expect(recomputeSlotOverrides(slot, getModule)).toEqual([]);
  });

  it('returns empty when module not found', () => {
    const slot = makeSlot({
      fxModuleId: 'deleted-module',
      params: [{ name: 'TYPE', value: 'HALL1' }],
    });
    expect(recomputeSlotOverrides(slot, getModule)).toEqual([]);
  });

  it('returns empty when params match module exactly', () => {
    const slot = makeSlot({
      fxModuleId: 'hall-wash',
      params: [...REVERB_MODULE.params],
    });
    expect(recomputeSlotOverrides(slot, getModule)).toEqual([]);
  });

  it('computes changed params as overrides', () => {
    const slot = makeSlot({
      fxModuleId: 'hall-wash',
      params: [
        { name: 'TYPE', value: 'HALL1' },
        { name: 'TIME', value: '3.0' },
        { name: 'LEVEL', value: '80' },
        { name: 'PRE_DELAY', value: '10' },
      ],
    });
    expect(recomputeSlotOverrides(slot, getModule)).toEqual([
      { name: 'TIME', value: '3.0' },
    ]);
  });
});

// ── Round-trip: resolve → computeOverrides ───────────────────────────

describe('round-trip: resolve → computeOverrides', () => {
  const getModule = moduleStore([REVERB_MODULE, COMP_MODULE]);

  it('overrides survive resolution and recomputation', () => {
    const originalOverrides: FxParam[] = [
      { name: 'TIME', value: '3.0' },
      { name: 'LEVEL', value: '60' },
    ];

    // Step 1: resolve slot with overrides
    const slot = makeSlot({
      fxModuleId: 'hall-wash',
      params: [],
      overrides: originalOverrides,
    });
    const resolved = resolveSlotParams(slot, getModule);

    // Step 2: recompute overrides from resolved params
    const recomputed = computeOverrides(REVERB_MODULE.params, resolved);

    expect(recomputed).toEqual(originalOverrides);
  });

  it('no overrides → resolve → recompute → still empty', () => {
    const slot = makeSlot({
      fxModuleId: 'hall-wash',
      params: [],
      overrides: [],
    });
    const resolved = resolveSlotParams(slot, getModule);
    const recomputed = computeOverrides(REVERB_MODULE.params, resolved);
    expect(recomputed).toEqual([]);
  });

  it('all overridden → resolve → recompute → all returned', () => {
    const allOverrides: FxParam[] = [
      { name: 'TYPE', value: 'ROOM1' },
      { name: 'TIME', value: '1.0' },
      { name: 'LEVEL', value: '50' },
      { name: 'PRE_DELAY', value: '0' },
    ];
    const slot = makeSlot({
      fxModuleId: 'hall-wash',
      params: [],
      overrides: allOverrides,
    });
    const resolved = resolveSlotParams(slot, getModule);
    const recomputed = computeOverrides(REVERB_MODULE.params, resolved);
    expect(recomputed).toEqual(allOverrides);
  });
});

// ── Propagation semantics ────────────────────────────────────────────

describe('propagation: module update preserves overrides', () => {
  it('when module params change, overrides are preserved on re-resolve', () => {
    const originalModule = makeModule('hall-wash', 'REVERB', [
      { name: 'TYPE', value: 'HALL1' },
      { name: 'TIME', value: '5.0' },
      { name: 'LEVEL', value: '80' },
    ]);

    const updatedModule = makeModule('hall-wash', 'REVERB', [
      { name: 'TYPE', value: 'HALL2' },     // changed by module author
      { name: 'TIME', value: '6.0' },       // changed by module author
      { name: 'LEVEL', value: '80' },       // unchanged
    ]);

    const slot = makeSlot({
      fxModuleId: 'hall-wash',
      params: [],
      overrides: [{ name: 'TIME', value: '3.0' }], // user's override
    });

    // Before module update
    const getOriginal = moduleStore([originalModule]);
    const resolvedBefore = resolveSlotParams(slot, getOriginal);
    expect(resolvedBefore).toEqual([
      { name: 'TYPE', value: 'HALL1' },
      { name: 'TIME', value: '3.0' },  // user override
      { name: 'LEVEL', value: '80' },
    ]);

    // After module update — user's TIME override is preserved,
    // but TYPE picks up the module author's change
    const getUpdated = moduleStore([updatedModule]);
    const resolvedAfter = resolveSlotParams(slot, getUpdated);
    expect(resolvedAfter).toEqual([
      { name: 'TYPE', value: 'HALL2' },  // module update propagated
      { name: 'TIME', value: '3.0' },    // user override preserved
      { name: 'LEVEL', value: '80' },
    ]);
  });

  it('when module adds new params, they appear in resolved output', () => {
    const v1 = makeModule('hall-wash', 'REVERB', [
      { name: 'TYPE', value: 'HALL1' },
      { name: 'TIME', value: '5.0' },
    ]);

    const v2 = makeModule('hall-wash', 'REVERB', [
      { name: 'TYPE', value: 'HALL1' },
      { name: 'TIME', value: '5.0' },
      { name: 'DENSITY', value: '50' }, // new param in v2
    ]);

    const slot = makeSlot({
      fxModuleId: 'hall-wash',
      params: [],
      overrides: [{ name: 'TIME', value: '3.0' }],
    });

    const resolvedV1 = resolveSlotParams(slot, moduleStore([v1]));
    expect(resolvedV1).toHaveLength(2);

    const resolvedV2 = resolveSlotParams(slot, moduleStore([v2]));
    expect(resolvedV2).toHaveLength(3);
    expect(resolvedV2[2]).toEqual({ name: 'DENSITY', value: '50' });
  });
});

// ── Schema validation ────────────────────────────────────────────────

describe('schema validation with inheritance fields', () => {
  // Import schemas lazily to keep test file focused on resolution logic
  it('FxSlotDataSchema accepts fxModuleId and overrides', async () => {
    const { FxSlotDataSchema } = await import('../src/schemas/rack.js');
    const result = FxSlotDataSchema.safeParse({
      slot: 'A',
      effect: 'REVERB',
      fxModuleId: 'hall-wash',
      params: [{ name: 'TYPE', value: 'HALL1' }],
      overrides: [{ name: 'TIME', value: '3.0' }],
    });
    expect(result.success).toBe(true);
  });

  it('FxSlotDataSchema still works without inheritance fields', async () => {
    const { FxSlotDataSchema } = await import('../src/schemas/rack.js');
    const result = FxSlotDataSchema.safeParse({
      slot: 'A',
      effect: 'REVERB',
      params: [{ name: 'TYPE', value: 'HALL1' }],
    });
    expect(result.success).toBe(true);
  });

  it('MemoryFxSlotSchema accepts fxModuleId and overrides', async () => {
    const { MemoryFxSlotSchema } = await import(
      '../src/schemas/memory-config.js'
    );
    const result = MemoryFxSlotSchema.safeParse({
      slot: 'B',
      effect: 'NATURALCOMP',
      fxModuleId: 'gentle-comp',
      params: [],
      overrides: [{ name: 'SUSTAIN', value: '70' }],
    });
    expect(result.success).toBe(true);
  });

  it('MemoryBankSchema accepts sourceRackId', async () => {
    const { MemoryBankSchema } = await import(
      '../src/schemas/memory-config.js'
    );
    const result = MemoryBankSchema.safeParse({
      bank: 'A',
      sourceRackId: 'vocal-processing',
      slots: [{ slot: 'A', effect: 'REVERB', params: [] }],
    });
    expect(result.success).toBe(true);
  });

  it('MemoryBankSchema still works without sourceRackId', async () => {
    const { MemoryBankSchema } = await import(
      '../src/schemas/memory-config.js'
    );
    const result = MemoryBankSchema.safeParse({
      bank: 'A',
      slots: [{ slot: 'A', effect: 'REVERB', params: [] }],
    });
    expect(result.success).toBe(true);
  });
});
