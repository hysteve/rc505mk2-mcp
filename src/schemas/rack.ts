/**
 * Zod schemas for Rack presets and related types (FxSlotData, settings, tips).
 */

import { z } from 'zod';
import { FxSlotIdSchema, FxParamSchema } from './fx-param.js';

export const FxSlotDataSchema = z.object({
  slot: FxSlotIdSchema,
  bank: FxSlotIdSchema.optional(),
  label: z.string().optional(),
  effect: z.string().min(1),

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

export const TipSchema = z.object({
  type: z.enum(['tip', 'performance', 'how', 'warning']),
  title: z.string(),
  text: z.string(),
});

export const TrackSettingsSchema = z.object({
  trackNumber: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  level: z.number().int().min(0).max(200).optional(),
  pan: z.number().int().min(0).max(100).optional(),
  reverse: z.boolean().optional(),
  oneShot: z.boolean().optional(),
  fx: z.boolean().optional(),
  startMode: z.number().int().min(0).max(1).optional(),
  stopMode: z.number().int().min(0).max(2).optional(),
});

export const MasterSettingsSchema = z.object({
  tempo: z.number().min(40.0).max(300.0).optional(),
});

export const RecSettingsSchema = z.object({
  recAction: z.number().int().min(0).max(1).optional(),
  quantize: z.number().int().min(0).max(1).optional(),
  autoRec: z.boolean().optional(),
  autoRecSens: z.number().int().min(0).max(100).optional(),
});

export const PlaySettingsSchema = z.object({
  currentTrack: z.number().int().min(0).max(4).optional(),
  fadeTimeIn: z.number().optional(),
  fadeTimeOut: z.number().optional(),
});

export const RhythmSettingsSchema = z.object({
  genre: z.number().int().min(0).max(20).optional(),
  pattern: z.number().optional(),
  variation: z.number().int().min(0).max(3).optional(),
  kit: z.number().int().min(0).max(15).optional(),
});

export const PresetSettingsSchema = z.object({
  tracks: z.array(TrackSettingsSchema).optional(),
  master: MasterSettingsSchema.optional(),
  rec: RecSettingsSchema.optional(),
  play: PlaySettingsSchema.optional(),
  rhythm: RhythmSettingsSchema.optional(),
});

export const RackSchema = z.object({
  id: z.string().min(1),
  section: z.string(),
  title: z.string().min(1),
  icon: z.string(),
  genres: z.array(z.string()),
  inputType: z.string(),
  description: z.string(),
  inputFx: z.array(FxSlotDataSchema),
  trackFx: z.array(FxSlotDataSchema),
  tips: z.array(TipSchema),
  settings: PresetSettingsSchema.optional(),
  fxTypes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  badge: z.enum(['new', 'trending', 'popular']).optional(),
});

export type FxSlotData = z.infer<typeof FxSlotDataSchema>;
export type Tip = z.infer<typeof TipSchema>;
export type TrackSettings = z.infer<typeof TrackSettingsSchema>;
export type MasterSettings = z.infer<typeof MasterSettingsSchema>;
export type RecSettings = z.infer<typeof RecSettingsSchema>;
export type PlaySettings = z.infer<typeof PlaySettingsSchema>;
export type RhythmSettings = z.infer<typeof RhythmSettingsSchema>;
export type PresetSettings = z.infer<typeof PresetSettingsSchema>;
export type Rack = z.infer<typeof RackSchema>;
