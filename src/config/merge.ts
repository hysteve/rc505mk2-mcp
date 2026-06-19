/**
 * Merge two MemoryConfig objects — applies changes from `incoming` onto `existing`.
 *
 * Merge strategy:
 * - FX sections (inputFx, trackFx): merge at the bank level.
 *   Banks present in `incoming` replace the same bank in `existing`;
 *   banks only in `existing` are preserved unchanged.
 * - Scalar settings (name, master, rec, play, rhythm): overwritten only
 *   when explicitly present in `incoming`.
 * - Track settings: merged per-track (incoming tracks override by trackNumber).
 */

import type {
  MemoryConfig,
  MemoryFxSection,
  MemoryBank,
  MemoryTrackSettings,
} from '../types/memory-config.js';

function mergeFxSection(
  existing: MemoryFxSection,
  incoming: MemoryFxSection,
): MemoryFxSection {
  // Build a map of existing banks by letter
  const bankMap = new Map<string, MemoryBank>();
  for (const bank of existing.banks) {
    bankMap.set(bank.bank, bank);
  }

  // Incoming banks overwrite at the bank level
  for (const bank of incoming.banks) {
    bankMap.set(bank.bank, bank);
  }

  // Sort banks A-D for consistency
  const merged = Array.from(bankMap.values()).sort(
    (a, b) => a.bank.charCodeAt(0) - b.bank.charCodeAt(0),
  );

  return {
    activeBank: incoming.activeBank ?? existing.activeBank,
    banks: merged,
  };
}

function mergeTrackSettings(
  existing?: MemoryTrackSettings[],
  incoming?: MemoryTrackSettings[],
): MemoryTrackSettings[] | undefined {
  if (!incoming?.length) return existing;
  if (!existing?.length) return incoming;

  const trackMap = new Map<number, MemoryTrackSettings>();
  for (const t of existing) trackMap.set(t.trackNumber, t);
  for (const t of incoming) trackMap.set(t.trackNumber, t);

  return Array.from(trackMap.values()).sort(
    (a, b) => a.trackNumber - b.trackNumber,
  );
}

export function mergeMemoryConfigs(
  existing: MemoryConfig,
  incoming: MemoryConfig,
): MemoryConfig {
  return {
    version: 1,
    slotNumber: existing.slotNumber,
    // Overwrite name only if incoming has a non-empty name that differs from default
    name: incoming.name || existing.name,
    inputFx: mergeFxSection(existing.inputFx, incoming.inputFx),
    trackFx: mergeFxSection(existing.trackFx, incoming.trackFx),
    tracks: mergeTrackSettings(existing.tracks, incoming.tracks),
    master: incoming.master ?? existing.master,
    rec: incoming.rec ?? existing.rec,
    play: incoming.play ?? existing.play,
    rhythm: incoming.rhythm ?? existing.rhythm,
    // Metadata
    sourceRackId: incoming.sourceRackId ?? existing.sourceRackId,
    genres: incoming.genres ?? existing.genres,
    count: existing.count,
  };
}
