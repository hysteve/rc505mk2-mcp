/**
 * Tests for mergeMemoryConfigs — critical upload path (merge mode).
 *
 * Covers: bank-level merge, track-level merge, scalar override semantics,
 * empty/missing sections, multi-bank scenarios, and metadata handling.
 */

import { describe, it, expect } from 'vitest';
import { mergeMemoryConfigs } from '../src/config/merge.js';
import type {
  MemoryConfig,
  MemoryBank,
  MemoryFxSection,
  MemoryTrackSettings,
} from '../src/types/memory-config.js';

// ── Helpers ──────────────────────────────────────────────────────────

function emptySection(): MemoryFxSection {
  return { banks: [] };
}

function makeBank(bank: 'A' | 'B' | 'C' | 'D', effect: string): MemoryBank {
  return {
    bank,
    slots: [{ slot: 'A', effect, enabled: true, params: [] }],
  };
}

function makeConfig(overrides: Partial<MemoryConfig> = {}): MemoryConfig {
  return {
    version: 1,
    slotNumber: 1,
    name: 'EXISTING',
    inputFx: emptySection(),
    trackFx: emptySection(),
    ...overrides,
  };
}

function makeTrack(trackNumber: 1 | 2 | 3 | 4 | 5, overrides: Partial<MemoryTrackSettings> = {}): MemoryTrackSettings {
  return { trackNumber, level: 100, pan: 50, ...overrides };
}

// ── Bank-level FX merge ──────────────────────────────────────────────

describe('mergeMemoryConfigs — FX bank merge', () => {
  it('incoming bank replaces existing bank with same letter', () => {
    const existing = makeConfig({
      inputFx: { banks: [makeBank('A', 'REVERB')] },
    });
    const incoming = makeConfig({
      inputFx: { banks: [makeBank('A', 'DELAY')] },
    });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.inputFx.banks).toHaveLength(1);
    expect(merged.inputFx.banks[0].bank).toBe('A');
    expect(merged.inputFx.banks[0].slots[0].effect).toBe('DELAY');
  });

  it('preserves existing banks not present in incoming', () => {
    const existing = makeConfig({
      inputFx: { banks: [makeBank('A', 'REVERB'), makeBank('B', 'DELAY')] },
    });
    const incoming = makeConfig({
      inputFx: { banks: [makeBank('A', 'EQ')] },
    });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.inputFx.banks).toHaveLength(2);
    expect(merged.inputFx.banks[0].slots[0].effect).toBe('EQ');   // A replaced
    expect(merged.inputFx.banks[1].slots[0].effect).toBe('DELAY'); // B preserved
  });

  it('adds new banks from incoming that did not exist', () => {
    const existing = makeConfig({
      inputFx: { banks: [makeBank('A', 'REVERB')] },
    });
    const incoming = makeConfig({
      inputFx: { banks: [makeBank('C', 'DYNAMICS')] },
    });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.inputFx.banks).toHaveLength(2);
    expect(merged.inputFx.banks[0].bank).toBe('A');
    expect(merged.inputFx.banks[1].bank).toBe('C');
  });

  it('sorts merged banks alphabetically A-D', () => {
    const existing = makeConfig({
      inputFx: { banks: [makeBank('D', 'REVERB'), makeBank('A', 'EQ')] },
    });
    const incoming = makeConfig({
      inputFx: { banks: [makeBank('C', 'DELAY'), makeBank('B', 'DYNAMICS')] },
    });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.inputFx.banks.map(b => b.bank)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('merges inputFx and trackFx independently', () => {
    const existing = makeConfig({
      inputFx: { banks: [makeBank('A', 'REVERB')] },
      trackFx: { banks: [makeBank('A', 'DELAY')] },
    });
    const incoming = makeConfig({
      inputFx: { banks: [makeBank('A', 'EQ')] },
      trackFx: { banks: [] },  // no trackFx changes
    });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.inputFx.banks[0].slots[0].effect).toBe('EQ');
    expect(merged.trackFx.banks[0].slots[0].effect).toBe('DELAY'); // preserved
  });

  it('uses incoming activeBank when present', () => {
    const existing = makeConfig({
      inputFx: { activeBank: 0, banks: [] },
    });
    const incoming = makeConfig({
      inputFx: { activeBank: 2, banks: [] },
    });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.inputFx.activeBank).toBe(2);
  });

  it('falls back to existing activeBank when incoming is undefined', () => {
    const existing = makeConfig({
      inputFx: { activeBank: 1, banks: [] },
    });
    const incoming = makeConfig({
      inputFx: { banks: [] },
    });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.inputFx.activeBank).toBe(1);
  });
});

// ── Multi-bank merge (all 4 banks populated) ─────────────────────────

describe('mergeMemoryConfigs — multi-bank', () => {
  it('handles all 4 banks populated in existing', () => {
    const existing = makeConfig({
      inputFx: {
        banks: [
          makeBank('A', 'REVERB'),
          makeBank('B', 'DELAY'),
          makeBank('C', 'EQ'),
          makeBank('D', 'DYNAMICS'),
        ],
      },
    });
    const incoming = makeConfig({
      inputFx: { banks: [makeBank('B', 'TRANSPOSE')] },
    });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.inputFx.banks).toHaveLength(4);
    expect(merged.inputFx.banks[0].slots[0].effect).toBe('REVERB');
    expect(merged.inputFx.banks[1].slots[0].effect).toBe('TRANSPOSE'); // replaced
    expect(merged.inputFx.banks[2].slots[0].effect).toBe('EQ');
    expect(merged.inputFx.banks[3].slots[0].effect).toBe('DYNAMICS');
  });

  it('replaces multiple banks at once', () => {
    const existing = makeConfig({
      trackFx: {
        banks: [
          makeBank('A', 'REVERB'),
          makeBank('B', 'DELAY'),
          makeBank('C', 'EQ'),
          makeBank('D', 'DYNAMICS'),
        ],
      },
    });
    const incoming = makeConfig({
      trackFx: {
        banks: [
          makeBank('A', 'LPF'),
          makeBank('C', 'HPF'),
          makeBank('D', 'FLANGER'),
        ],
      },
    });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.trackFx.banks).toHaveLength(4);
    expect(merged.trackFx.banks[0].slots[0].effect).toBe('LPF');
    expect(merged.trackFx.banks[1].slots[0].effect).toBe('DELAY');     // preserved
    expect(merged.trackFx.banks[2].slots[0].effect).toBe('HPF');
    expect(merged.trackFx.banks[3].slots[0].effect).toBe('FLANGER');
  });

  it('builds up from empty existing to all 4 banks', () => {
    const existing = makeConfig({ inputFx: emptySection() });
    const incoming = makeConfig({
      inputFx: {
        banks: [
          makeBank('A', 'REVERB'),
          makeBank('B', 'DELAY'),
          makeBank('C', 'EQ'),
          makeBank('D', 'DYNAMICS'),
        ],
      },
    });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.inputFx.banks).toHaveLength(4);
    expect(merged.inputFx.banks.map(b => b.bank)).toEqual(['A', 'B', 'C', 'D']);
  });
});

// ── Track-level merge ────────────────────────────────────────────────

describe('mergeMemoryConfigs — track merge', () => {
  it('incoming tracks override by trackNumber', () => {
    const existing = makeConfig({
      tracks: [makeTrack(1, { level: 80 }), makeTrack(2, { level: 90 })],
    });
    const incoming = makeConfig({
      tracks: [makeTrack(2, { level: 50 })],
    });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.tracks).toHaveLength(2);
    expect(merged.tracks![0].level).toBe(80);  // track 1 preserved
    expect(merged.tracks![1].level).toBe(50);  // track 2 replaced
  });

  it('adds new tracks from incoming', () => {
    const existing = makeConfig({
      tracks: [makeTrack(1, { level: 100 })],
    });
    const incoming = makeConfig({
      tracks: [makeTrack(3, { level: 75 })],
    });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.tracks).toHaveLength(2);
    expect(merged.tracks!.map(t => t.trackNumber)).toEqual([1, 3]);
  });

  it('sorts merged tracks by trackNumber', () => {
    const existing = makeConfig({
      tracks: [makeTrack(5), makeTrack(2)],
    });
    const incoming = makeConfig({
      tracks: [makeTrack(4), makeTrack(1)],
    });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.tracks!.map(t => t.trackNumber)).toEqual([1, 2, 4, 5]);
  });

  it('returns existing tracks when incoming has none', () => {
    const existing = makeConfig({
      tracks: [makeTrack(1), makeTrack(2)],
    });
    const incoming = makeConfig({});

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.tracks).toHaveLength(2);
  });

  it('returns incoming tracks when existing has none', () => {
    const existing = makeConfig({});
    const incoming = makeConfig({
      tracks: [makeTrack(3, { level: 60 })],
    });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.tracks).toHaveLength(1);
    expect(merged.tracks![0].trackNumber).toBe(3);
  });

  it('returns undefined when neither has tracks', () => {
    const existing = makeConfig({});
    const incoming = makeConfig({});

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.tracks).toBeUndefined();
  });
});

// ── Scalar override semantics ────────────────────────────────────────

describe('mergeMemoryConfigs — scalar settings', () => {
  it('overwrites name only when incoming has non-empty name', () => {
    const existing = makeConfig({ name: 'OLD NAME' });
    const incoming = makeConfig({ name: 'NEW NAME' });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.name).toBe('NEW NAME');
  });

  it('preserves existing name when incoming name is empty', () => {
    const existing = makeConfig({ name: 'OLD NAME' });
    const incoming = makeConfig({ name: '' });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.name).toBe('OLD NAME');
  });

  it('always uses existing slotNumber', () => {
    const existing = makeConfig({ slotNumber: 42 });
    const incoming = makeConfig({ slotNumber: 99 });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.slotNumber).toBe(42);
  });

  it('always sets version to 1', () => {
    const merged = mergeMemoryConfigs(makeConfig(), makeConfig());
    expect(merged.version).toBe(1);
  });

  it('overwrites master when incoming has it', () => {
    const existing = makeConfig({ master: { tempo: 120 } });
    const incoming = makeConfig({ master: { tempo: 90 } });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.master?.tempo).toBe(90);
  });

  it('preserves existing master when incoming has none', () => {
    const existing = makeConfig({ master: { tempo: 120 } });
    const incoming = makeConfig({});

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.master?.tempo).toBe(120);
  });

  it('overwrites rec settings when incoming has them', () => {
    const existing = makeConfig({ rec: { recAction: 0, quantize: 1 } });
    const incoming = makeConfig({ rec: { recAction: 1 } });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.rec?.recAction).toBe(1);
    // Note: incoming replaces the whole rec object, so quantize is gone
    expect(merged.rec?.quantize).toBeUndefined();
  });

  it('preserves existing rec when incoming has none', () => {
    const existing = makeConfig({ rec: { recAction: 0 } });
    const incoming = makeConfig({});

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.rec?.recAction).toBe(0);
  });

  it('overwrites play settings when incoming has them', () => {
    const existing = makeConfig({ play: { currentTrack: 0 } });
    const incoming = makeConfig({ play: { currentTrack: 3 } });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.play?.currentTrack).toBe(3);
  });

  it('overwrites rhythm settings when incoming has them', () => {
    const existing = makeConfig({ rhythm: { genre: 5 } });
    const incoming = makeConfig({ rhythm: { genre: 10 } });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.rhythm?.genre).toBe(10);
  });
});

// ── Metadata handling ────────────────────────────────────────────────

describe('mergeMemoryConfigs — metadata', () => {
  it('incoming sourceRackId takes precedence', () => {
    const existing = makeConfig({ sourceRackId: 'old-rack' });
    const incoming = makeConfig({ sourceRackId: 'new-rack' });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.sourceRackId).toBe('new-rack');
  });

  it('falls back to existing sourceRackId when incoming is undefined', () => {
    const existing = makeConfig({ sourceRackId: 'old-rack' });
    const incoming = makeConfig({});

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.sourceRackId).toBe('old-rack');
  });

  it('incoming genres take precedence', () => {
    const existing = makeConfig({ genres: ['ambient'] });
    const incoming = makeConfig({ genres: ['electronic', 'bass'] });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.genres).toEqual(['electronic', 'bass']);
  });

  it('always uses existing count', () => {
    const existing = makeConfig({ count: '00FF' });
    const incoming = makeConfig({ count: '0001' });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.count).toBe('00FF');
  });
});

// ── Edge cases ───────────────────────────────────────────────────────

describe('mergeMemoryConfigs — edge cases', () => {
  it('merging two empty configs produces valid config', () => {
    const existing = makeConfig({ inputFx: emptySection(), trackFx: emptySection() });
    const incoming = makeConfig({ inputFx: emptySection(), trackFx: emptySection() });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.version).toBe(1);
    expect(merged.inputFx.banks).toEqual([]);
    expect(merged.trackFx.banks).toEqual([]);
  });

  it('preserves multi-slot banks through merge', () => {
    const existing = makeConfig({
      inputFx: {
        banks: [{
          bank: 'A',
          slots: [
            { slot: 'A', effect: 'EQ', enabled: true, params: [] },
            { slot: 'B', effect: 'DYNAMICS', enabled: true, params: [] },
            { slot: 'C', effect: 'REVERB', enabled: false, params: [] },
          ],
        }],
      },
    });
    const incoming = makeConfig({ inputFx: emptySection() });

    const merged = mergeMemoryConfigs(existing, incoming);
    expect(merged.inputFx.banks[0].slots).toHaveLength(3);
    expect(merged.inputFx.banks[0].slots[2].enabled).toBe(false);
  });

  it('preserves FX params and sequencer data through merge', () => {
    const existing = makeConfig({
      inputFx: {
        banks: [{
          bank: 'A',
          slots: [{
            slot: 'A',
            effect: 'TRANSPOSE',
            enabled: true,
            params: [{ name: 'TRANS', value: '50' }],
            sequencer: [
              { name: 'SW', value: 'ON' },
              { name: 'STEP 1', value: '5' },
            ],
          }],
        }],
      },
    });
    const incoming = makeConfig({ inputFx: emptySection() });

    const merged = mergeMemoryConfigs(existing, incoming);
    const slot = merged.inputFx.banks[0].slots[0];
    expect(slot.params).toEqual([{ name: 'TRANS', value: '50' }]);
    expect(slot.sequencer).toEqual([
      { name: 'SW', value: 'ON' },
      { name: 'STEP 1', value: '5' },
    ]);
  });

  it('incoming bank completely replaces — does not merge at slot level', () => {
    const existing = makeConfig({
      inputFx: {
        banks: [{
          bank: 'A',
          slots: [
            { slot: 'A', effect: 'REVERB', enabled: true, params: [] },
            { slot: 'B', effect: 'DELAY', enabled: true, params: [] },
          ],
        }],
      },
    });
    const incoming = makeConfig({
      inputFx: {
        banks: [{
          bank: 'A',
          slots: [
            { slot: 'A', effect: 'EQ', enabled: true, params: [] },
          ],
        }],
      },
    });

    const merged = mergeMemoryConfigs(existing, incoming);
    // Incoming bank A has only 1 slot — it replaces entirely, not slot-level merge
    expect(merged.inputFx.banks[0].slots).toHaveLength(1);
    expect(merged.inputFx.banks[0].slots[0].effect).toBe('EQ');
  });
});
