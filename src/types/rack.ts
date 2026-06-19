/**
 * Rack preset types — re-exported from Zod schemas (source of truth).
 *
 * All types are inferred from their Zod schema definitions in ../schemas/.
 * This file exists for backwards compatibility — existing imports keep working.
 */

export type { FxParam } from '../schemas/fx-param.js';

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
} from '../schemas/rack.js';

export type { FxModule } from '../schemas/fx-module.js';
