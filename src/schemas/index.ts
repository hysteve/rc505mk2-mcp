/**
 * Schema index — re-exports all Zod schemas and their inferred types.
 * Schemas are the single source of truth; types/ files re-export from here.
 */

// ── Schemas ─────────────────────────────────────────────────────────

export {
  FxSlotIdSchema,
  FxContextSchema,
  FxParamSchema,
} from './fx-param.js';

export { FxModuleSchema } from './fx-module.js';

export {
  FxSlotDataSchema,
  TipSchema,
  TrackSettingsSchema,
  MasterSettingsSchema,
  RecSettingsSchema,
  PlaySettingsSchema,
  RhythmSettingsSchema,
  PresetSettingsSchema,
  RackSchema,
} from './rack.js';

export {
  MemoryFxSlotSchema,
  MemoryBankSchema,
  MemoryFxSectionSchema,
  MemoryTrackSettingsSchema,
  MemoryMasterSettingsSchema,
  MemoryRecSettingsSchema,
  MemoryPlaySettingsSchema,
  MemoryRhythmSettingsSchema,
  MemoryConfigSchema,
  MemoryFilePairSchema,
} from './memory-config.js';

// ── Dynamic Validators ──────────────────────────────────────────────

export { buildFxParamsSchema, validateFxModuleParams } from './param-validators.js';

// ── Inferred Types ──────────────────────────────────────────────────

export type { FxSlotId, FxParam } from './fx-param.js';
export type { FxModule } from './fx-module.js';

export type {
  FxSlotData,
  Tip,
  TrackSettings,
  MasterSettings,
  RecSettings,
  PlaySettings,
  RhythmSettings,
  PresetSettings,
  Rack,
} from './rack.js';

export type {
  MemoryFxSlot,
  MemoryBank,
  MemoryFxSection,
  MemoryTrackSettings,
  MemoryMasterSettings,
  MemoryRecSettings,
  MemoryPlaySettings,
  MemoryRhythmSettings,
  MemoryConfig,
  MemoryFilePair,
} from './memory-config.js';
