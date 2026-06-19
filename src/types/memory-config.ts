/**
 * MemoryConfig types — re-exported from Zod schemas (source of truth).
 *
 * All types are inferred from their Zod schema definitions in ../schemas/.
 * This file exists for backwards compatibility — existing imports keep working.
 */

export type { FxSlotId, FxParam } from '../schemas/fx-param.js';

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
} from '../schemas/memory-config.js';
