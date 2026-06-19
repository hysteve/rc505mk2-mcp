/**
 * Zod schemas for MemoryConfig and all sub-types.
 * These mirror the interfaces in types/memory-config.ts.
 */

import { z } from 'zod';
import { FxSlotIdSchema, FxParamSchema } from './fx-param.js';

// ── FX Slot & Bank ──────────────────────────────────────────────────

export const MemoryFxSlotSchema = z.object({
  slot: FxSlotIdSchema,
  effect: z.string().min(1),
  label: z.string().optional(),
  enabled: z.boolean().optional(),

  /** Source FX module ID — when set, params are resolved from module + overrides */
  fxModuleId: z.string().optional(),

  /** Full resolved parameter set (always complete — used for generation and display) */
  params: z.array(FxParamSchema),

  /**
   * Only the params that differ from the source fxModule.
   * When fxModuleId is set and overrides is empty, all values are inherited.
   * When fxModuleId is unset, overrides is unused (params is authoritative).
   */
  overrides: z.array(FxParamSchema).optional(),

  sequencer: z.array(FxParamSchema).optional(),
});

export const MemoryBankSchema = z.object({
  bank: FxSlotIdSchema,
  /** Source rack preset ID for this bank (enables rack→memory inheritance) */
  sourceRackId: z.string().optional(),
  slots: z.array(MemoryFxSlotSchema).max(4),
});

export const MemoryFxSectionSchema = z.object({
  activeBank: z.number().int().min(0).max(3).optional(),
  banks: z.array(MemoryBankSchema).max(4),
});

// ── Track & Master Settings ─────────────────────────────────────────

export const MemoryTrackSettingsSchema = z.object({
  trackNumber: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  level: z.number().int().min(0).max(200).optional(),
  pan: z.number().int().min(0).max(100).optional(),
  reverse: z.boolean().optional(),
  oneShot: z.boolean().optional(),
  fx: z.boolean().optional(),
  startMode: z.number().int().min(0).max(1).optional(),
  stopMode: z.number().int().min(0).max(2).optional(),
});

export const MemoryMasterSettingsSchema = z.object({
  tempo: z.number().min(40.0).max(300.0).optional(),
});

export const MemoryRecSettingsSchema = z.object({
  recAction: z.number().int().min(0).max(1).optional(),
  quantize: z.number().int().min(0).max(1).optional(),
  autoRec: z.boolean().optional(),
  autoRecSens: z.number().int().min(0).max(100).optional(),
});

export const MemoryPlaySettingsSchema = z.object({
  currentTrack: z.number().int().min(0).max(4).optional(),
  fadeTimeIn: z.number().optional(),
  fadeTimeOut: z.number().optional(),
});

export const MemoryRhythmSettingsSchema = z.object({
  genre: z.number().int().min(0).max(20).optional(),
  pattern: z.number().optional(),
  variation: z.number().int().min(0).max(3).optional(),
  kit: z.number().int().min(0).max(15).optional(),
});

// ── Top-Level Memory Config ─────────────────────────────────────────

export const MemoryConfigSchema = z.object({
  version: z.literal(1),
  slotNumber: z.number().int().min(1).max(99),
  name: z.string().max(12),
  inputFx: MemoryFxSectionSchema,
  trackFx: MemoryFxSectionSchema,
  tracks: z.array(MemoryTrackSettingsSchema).optional(),
  master: MemoryMasterSettingsSchema.optional(),
  rec: MemoryRecSettingsSchema.optional(),
  play: MemoryPlaySettingsSchema.optional(),
  rhythm: MemoryRhythmSettingsSchema.optional(),
  sourceRackId: z.string().optional(),
  genres: z.array(z.string()).optional(),
  count: z.string().regex(/^[0-9A-Fa-f]{4}$/).optional(),
});

export const MemoryFilePairSchema = z.object({
  a: MemoryConfigSchema,
  b: MemoryConfigSchema,
  active: z.enum(['a', 'b']),
});

// ── Inferred Types ──────────────────────────────────────────────────

export type MemoryFxSlot = z.infer<typeof MemoryFxSlotSchema>;
export type MemoryBank = z.infer<typeof MemoryBankSchema>;
export type MemoryFxSection = z.infer<typeof MemoryFxSectionSchema>;
export type MemoryTrackSettings = z.infer<typeof MemoryTrackSettingsSchema>;
export type MemoryMasterSettings = z.infer<typeof MemoryMasterSettingsSchema>;
export type MemoryRecSettings = z.infer<typeof MemoryRecSettingsSchema>;
export type MemoryPlaySettings = z.infer<typeof MemoryPlaySettingsSchema>;
export type MemoryRhythmSettings = z.infer<typeof MemoryRhythmSettingsSchema>;
export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;
export type MemoryFilePair = z.infer<typeof MemoryFilePairSchema>;
