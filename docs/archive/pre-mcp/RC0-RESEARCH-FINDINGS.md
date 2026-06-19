# RC-505mk2 RC0 File Research — Findings, Progress & Next Steps

> **Last updated:** 2026-02-16
> **Purpose:** Reference document for continuing work across sessions or agents.

---

## 1. Device File System Structure

When the RC-505mk2 is connected via USB in Storage Mode (`MENU > USB > STORAGE > CONNECT`), it mounts as a removable drive with this structure:

```
ROLAND/
├── DATA/
│   ├── MEMORY001A.RC0
│   ├── MEMORY001B.RC0
│   ├── MEMORY002A.RC0
│   ├── MEMORY002B.RC0
│   ├── ...
│   ├── MEMORY099A.RC0
│   └── MEMORY099B.RC0
└── WAVE/
    └── (audio sample data for recorded loops)
```

**Key finding:** Each memory slot has **two files** (A and B), not one. This is a factory convention — the naming comes directly from the device firmware, not from user labeling.

This is different from what community tools (rc600editor.com, boss-rc500-editor) document. Those tools reference a single monolithic `MEMORY1.RC0` file, which may apply to the RC-600 or older firmware versions. The RC-505mk2 uses per-slot paired files.

---

## 2. RC0 File Format

Each `.RC0` file is XML with this structure:

```xml
<?xml version="1.0" encoding="utf-8"?>
<database name="RC-505MK2" revision="0">
  <mem id="0">
    <NAME>...</NAME>           <!-- 12-char ASCII preset name -->
    <TRACK1>...<TRACK6>        <!-- Per-track settings (device has 5 tracks + 1 spare?) -->
    <MASTER>                   <!-- Master tempo, audio state -->
    <REC>                      <!-- Recording settings -->
    <PLAY>                     <!-- Playback settings -->
    <RHYTHM>                   <!-- Rhythm machine config -->
    <ASSIGN1>...<ASSIGN16>     <!-- Control assignments -->
    <CTL>                      <!-- Control function settings -->
    <MASTER_FX>                <!-- Master FX settings -->
    <FIXED_VALUE>
  </mem>
  <ifx id="0">                <!-- Input FX: 2 banks x 4 slots each -->
    <SETUP>                    <!-- Master IFX on/off -->
    <A>...<AD>                 <!-- Bank A config + slots A-D -->
    <AA_LPF>...<AD_REVERB>     <!-- Bank A per-slot effect parameters -->
    <B>...<BD>                 <!-- Bank B config + slots A-D -->
    <BA_LPF>...<BD_REVERB>     <!-- Bank B per-slot effect parameters -->
  </ifx>
  <tfx id="0">                <!-- Track FX: same structure as IFX -->
    ...
  </tfx>
</database>
<count>NNNN</count>            <!-- Save/revision counter -->
```

Each file is ~25,504 lines. The `<count>` tag at the end (outside `<database>`) increments on each save.

---

## 3. MEMORY001A vs MEMORY001B — Detailed Diff

Source files: `MEMORY001A.RC0` and `MEMORY001B.RC0` in project root (unaltered device exports, except some manual IFX changes on-device).

### Differences Found

**Track audio state (Tracks 1-3 only, Tracks 4-6 identical):**

| XML Tag | File A | File B | Meaning (from Parameter Guide) |
|---------|--------|--------|-------------------------------|
| `TRACK.J` | 15 | 1 | MEASURE: A=15 measures, B=FREE |
| `TRACK.S` | 8 | 0 | Audio state: A=recorded, B=empty |
| `TRACK.U` | 1213 | 1200 | Tempo: A=121.3 BPM, B=120.0 default |
| `TRACK.V` | 87230 | 88200 | Sample rate: A=tempo-adjusted, B=native |
| `TRACK.W` | 1 | 0 | Has audio flag: A=yes, B=no |
| `TRACK.X` | 697840 | 0 | Sample count: A=697,840, B=none |

**MASTER section:**

| Tag | File A | File B | Meaning |
|-----|--------|--------|---------|
| `MASTER.D` | 8 | 0 | Likely audio state indicator at master level |

**Input FX (IFX) — major differences:**

| Section | File A | File B | Meaning |
|---------|--------|--------|---------|
| `SETUP.A` | 0 | 1 | IFX master: A=OFF, B=ON |
| All 8 slot enables (AA-BD `.A`) | 0 | 1 | All slots: A=disabled, B=enabled |
| Slot FX types (AA-BD `.C`) | defaults | customized | B has different FX assigned |
| Various FX params | defaults | tuned | B has custom parameter values |

**Track FX (TFX):** Completely identical between A and B. Zero differences.

**Other:** `<count>` is 3 (A) vs 4 (B).

### Summary in Plain English (Pre-WRITE Export — Superseded)

> **NOTE:** This diff was from files exported BEFORE the user performed a WRITE operation on-device. The differences reflect two different unsaved states, NOT the intended A/B file relationship. See Section 4 for the confirmed behavior after a proper WRITE.

- **File A** = Had recorded audio on 3 tracks, but Input FX were OFF and at defaults (an older saved state)
- **File B** = No recorded audio, but Input FX were ON with custom FX types (a different older state)
- After performing WRITE on-device, both files become near-identical

---

## 4. Hypotheses on A/B File Purpose

### CONFIRMED: A = Saved State, B = Live/Working State

**Test sequence (2026-02-16):**

#### Test 1: WRITE then export
Recorded two tracks, set IFX (Slot A = Synth, Slot B = G2B, Slot C = Reverb), performed WRITE on-device, exported via USB.

**Result:** A and B were near-identical (only `<count>` differed). Both had the same IFX settings, track data, and parameters. This makes sense — a WRITE syncs the live state (B) into the saved state (A).

#### Test 2: Delete B file
Deleted MEMORY001B.RC0 from device, disconnected and reconnected.

**Result:** Device auto-recreated B from A with count incremented. The device requires both files and will clone the surviving file if one is missing.

#### Test 3: Delete A file
Deleted MEMORY001A.RC0, disconnected and reconnected.

**Result:** Device auto-recreated A from B with count incremented. Symmetrical behavior — either file can serve as source for recreation.

#### Test 4: Make live changes WITHOUT writing
Recorded a new track (Track 3), turned off IFX Slot A, added Vibrato to Slot D with custom params. Did NOT perform a WRITE. Exported via USB.

**Result:** Only B file had the changes. A file retained the previously WRITTEN state.

| Detail | 001A (saved) | 001B (live) |
|--------|-------------|-------------|
| `TRACK3.J` | unchanged | 9 (new recording) |
| `<AA><A>` (Slot A enable) | 1 (on) | 0 (off — user turned it off) |
| `<AA><C>` (Slot A FX type) | 5 | 49 (changed) |
| `<AD>` (Slot D) | disabled, defaults | enabled, VIBRATO assigned |
| `<AD_VIBRATO>` params | 64,50,50,0,100 (defaults) | 95,81,81,81,97 (user-tuned) |
| `<A><C>` (Bank A config) | 2 | 0 |

### Conclusion

**File A = the last explicitly WRITTEN/saved state.** Only updates when the user performs a WRITE (hold MEMORY) on the device.

**File B = the live/working state.** Updates in real-time as the user records tracks, changes FX, adjusts parameters — even without saving.

When a WRITE is performed, A is overwritten with B's current content (both files converge). If either file is deleted, the device recreates it from the surviving file on next boot.

The `<count>` tag increments on every write operation to either file (including auto-recreation from deletion).

### Implications for Generator

Since the device reads B as the active state:
- **Our generated preset should be identical for both A and B files** — this simulates a "freshly WRITTEN" state where both files are in sync
- The user's experience will be: load the memory slot and everything is ready (B = live state has the preset, A = saved state matches)
- If the user makes changes without writing, only B updates. If they WRITE, A catches up. Standard behavior.
- **We do NOT need to worry about differentiating A from B content** — outputting identical files is correct

### Key Parameter Confirmations from Test

| XML Path | Observed | Meaning |
|----------|----------|---------|
| `<ifx><SETUP><A>` | 1 | IFX master switch ON (when any IFX slots are active) |
| `<AA><A>` | 1 | Bank A Slot A enabled (Synth effect was assigned here) |
| `<AB><A>` | 1 | Bank A Slot B enabled (G2B effect was assigned here) |
| `<AC><A>` | 1 | Bank A Slot C enabled (Reverb effect was assigned here) |
| `<AD><A>` | 0 | Bank A Slot D disabled (no effect assigned) |
| `<AB_G2B>` | (params) | Confirms FX params are at `<BANKSLOT_EFFECTNAME>` path |
| `TRACK.J` | 9 | Measure count of recorded audio on that track |

---

## 5. Project Implementation Status

### Completed

| Component | File(s) | Status |
|-----------|---------|--------|
| RC0 Generator (pure function) | `src/lib/rc0-generator.ts` | Refactored, tested |
| Browser download wrapper | `src/lib/rc0-download.ts` | Created |
| Unit tests (43 tests) | `src/lib/__tests__/rc0-generator.test.ts` | All passing |
| Vitest config | `vitest.config.ts` | Created |
| Premium gate (mock paywall) | `src/components/PremiumGate.tsx` | Created |
| Premium gate wiring | `RackCard.tsx`, `RackModal.tsx` | Wired up |
| Installation guide (static section) | `src/components/StaticSections.tsx` | **Needs rewrite** |
| Installation guide (in-modal) | `src/components/RackModal.tsx` | **Needs rewrite** |
| Parameter reference | `RC505mk2-Parameter-Reference.txt` | Created |

### Needs Work

1. **~~Installation guide rewrite~~** — DONE. Rewritten to use simple USB file copy/overwrite workflow. No RC600 Editor or XML merging.

2. **Generator output format** — Currently generates a single RC0 file. Now that we've confirmed A and B are identical copies, the generator should:
   - Generate the RC0 content once
   - Output it as a pair of identically-named files: `MEMORY0XXA.RC0` + `MEMORY0XXB.RC0`
   - Let the user choose their target slot number (01-99) before download
   - Package both files as a `.zip` for download

3. **File naming** — Generator currently outputs `{rack.name}.RC0`. Needs to output `MEMORY0XXA.RC0` / `MEMORY0XXB.RC0` format where XX is the user-selected target slot.

4. **Full memory bank generation** — Future feature: generate all 99 slots as a complete `ROLAND/DATA/` directory that users can copy wholesale onto the device. This is the simplest possible user experience.

5. **In-browser preset builder** — Planned but not yet started. Would allow users to configure FX visually and generate custom RC0 files.

---

## 6. Key Technical Notes for Future Sessions

### xmldom Compatibility
The generator was refactored to work with both browser `DOMParser` and Node's `@xmldom/xmldom`:
- Cannot use `querySelector` — use `getElementsByTagName` instead
- Cannot use `Element.children` — use `childNodes` with `nodeType === 1` check
- The `generatePresetXml()` function accepts DOMParser/XMLSerializer as parameters for injection

### FX Type Enum
FX types are stored as numeric enums in `<XX><C>` tags. The mapping is in `FX_TYPE_ENUM` in `rc0-generator.ts`. Not all values are fully verified against the device — the PDF parameter guide lists effect names but not their numeric codes.

### Parameter Transforms
Several parameters require value transforms:
- EQ Gain: center offset of +20 (so 0 in file = -20dB, 20 = 0dB, 40 = +20dB)
- Dynamics Type, Reverb Type, Preamp Type, Dist Type: enum mappings
- See `PARAM_MAP` in `rc0-generator.ts` for the full transform registry

### Test Fixtures
Tests use `public/templates/default.rc0` as the template fixture. This is a factory-default single-preset RC0 file (25,504 lines).

---

## 7. Reference Files

| File | Purpose |
|------|---------|
| `MEMORY001A.RC0` | Device export — memory slot 1, file A |
| `MEMORY001B.RC0` | Device export — memory slot 1, file B |
| `public/templates/default.rc0` | Factory-default RC0 template for generator |
| `RC-505MK2_Parameter_eng04_W.pdf` | Official parameter guide (v1.3+) |
| `RC505mk2-Parameter-Reference.txt` | Text extraction of parameter guide for quick lookup |
| `RC505-Preset-Generator.md` | Original generator design notes |
