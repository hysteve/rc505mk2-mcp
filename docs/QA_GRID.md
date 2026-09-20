# QA Grid — on-device verification

Two tables. **Part 1** settles how the RC0 file encodes values (run once, before any preset is re-authored). **Part 2** is the per-preset verification (one row per preset, filled during Epic E).

Nothing in `PARAM_MAP` / `transforms.ts` is considered verified until it has a row here with a readback.

---

## Part 1 — Encoding checks

### Procedure

1. On the RC-505mk2, pick five scratch memory slots (suggested **95–99**) and dial in exactly the settings below. Only the listed params matter; leave everything else at default.
2. **WRITE** each memory on the device.
3. **MENU → USB → STORAGE → CONNECT**, then report the slot numbers.
4. Readback is done straight from the RC0 XML (raw integers, no transform in between) and recorded in the "Stored" column. The hypothesis that matches wins and the transform is updated the same day.

### Slot 95 — Input FX — RATE / STEP RATE encoding

| Slot | Effect | Set on device | Answers | Hypothesis A (numbers first) | Hypothesis B (notes first) | Stored | Verdict |
|------|--------|---------------|---------|------------------------------|----------------------------|--------|---------|
| IFX A | LPF | RATE = `50`, STEP RATE = `OFF` | where the 0–100 range sits | RATE 50, STEP 0 | RATE 64, STEP 0 | | |
| IFX B | HPF | RATE = `1/4`, STEP RATE = `1/8` | note-value index order | RATE 101+, STEP 101+ | RATE 6, STEP 10 (OFF=0 then notes) | | |
| IFX C | PHASER | RATE = `4MEAS`, STEP RATE = `50` | first note index; STEP numeric offset | RATE 101, STEP 50 | RATE 0, STEP 65 | | |
| IFX D | TREMOLO | RATE = `1/2` — **also note how many params the screen shows and their names** | 4th TREMOLO param (map has `LEVEL` tag D, guide lists 3 params) | | RATE 3 | | |

Evidence for B so far: template default for TREMOLO RATE is stored as 99 and the guide says the default is 85 (99 − 14 = 85, and there are 14 note entries). Filters store 3 (`1/2`), slicers 6 (`1/4`), chorus/auto-pan 64 (`50`).

### Slot 96 — Input FX — delay-type time encodings, FEEDBACK range

| Slot | Effect | Set on device | Answers | Current code | Stored | Verdict |
|------|--------|---------------|---------|--------------|--------|---------|
| IFX A | DELAY | TIME = `1/8`, FEEDBACK = **maximum the knob allows (write down the max)** | note index; FEEDBACK range (guide 1–16, template default 20) | TIME 4, FEEDBACK clamps at 16 | | |
| IFX B | DELAY | TIME = `300 ms`, FEEDBACK = `8` | ms offset (template default 200 ms is stored 211, code writes 210) | TIME 310 | | |
| IFX C | TAPE ECHO — the variant with LOW CUT / HIGH CUT (device may label it TAPE ECHO2) | REPEAT RATE = `1/4` — **note the on-screen param names** | whether map's `TIME`/`FEEDBACK` labels should be `REPEAT RATE`/`INTENSITY`; note encoding | tag A 7 | | |
| IFX D | ROLL — the variant with REPEAT (ROLL2) | TIME = `1/16`, REPEAT = `INF` | `INF` encoding (map has no INF) | TIME 1, REPEAT 0 | | |

### Slot 97 — Input FX — ranges and labels

| Slot | Effect | Set on device | Answers | Current code | Stored | Verdict |
|------|--------|---------------|---------|--------------|--------|---------|
| IFX A | EQ | LEVEL = **maximum (write down the range shown)**, LO = `+5`, HIGH = `-5` — **note the on-screen names of the two shelf params** | LEVEL range (guide extraction said 0–100, template says ±20) ; shelf labels | LEVEL 40, LO 25, HIGH 15 | | |
| IFX B | DYNAMICS | DYNAMICS = `+10` | ±20 centred | 30 | | |
| IFX C | PREAMP | MIC TYPE = **second option in the list — write down all five names** | `DYN ST` vs `DYN57` labels | 1 | | |
| IFX D | PATTERN SLICER | PATTERN = `P05`, RATE = `1/4` | pattern index base; TFX-style rate on a slicer | PATTERN 4, RATE 6 (B) / 101+ (A) | | |

### Slot 98 — Track FX — beat FX note lengths

| Slot | Effect | Set on device | Answers | Current code | Stored | Verdict |
|------|--------|---------------|---------|--------------|--------|---------|
| TFX bank A, slot A | BEAT REPEAT | LENGTH = `1/16` | `THRU, note values` encoding (map is plain number) | 1 (wrong) | | |
| TFX bank B, slot A | BEAT SCATTER | LENGTH = `1/4` | same, second data point | 1 (wrong) | | |

### Slot 99 — Track FX — beat shift, step slicer

| Slot | Effect | Set on device | Answers | Current code | Stored | Verdict |
|------|--------|---------------|---------|--------------|--------|---------|
| TFX bank A, slot A | BEAT SHIFT | SHIFT = `1/8` | `THRU, note values` encoding | 1 (wrong) | | |
| TFX bank A, slot B | STEP SLICER | RATE = `1/8` | rate encoding on a TFX slicer | 9 (B) / 101+ (A) | | |

### What changes once answered

| Result | Code change |
|--------|-------------|
| RATE / STEP RATE encoding | `rateValue`, `stepRateValue` + reverse + `TRANSFORM_META` (note values become first-class, numeric offset fixed) |
| BEAT LENGTH / SHIFT encoding | new `beatLength` transform + reverse; `LENGTH`/`SHIFT` get an enum meta with `THRU` + notes |
| DELAY FEEDBACK range | `feedback16` range or replacement; `fx-reference.json` note |
| DELAY TIME ms offset | `delayTime` / `rollTime` (+10 vs +11) |
| ROLL2 REPEAT `INF` | `rollRepeat` transform |
| EQ LEVEL, DYNAMICS | confirm only |
| TREMOLO 4th param, TAPE ECHO labels, MIC TYPE labels, EQ shelf labels | `PARAM_MAP` names / `fx-reference.json`; allow-list in `test/param-vocabulary.test.ts` shrinks |

---

## Part 2 — Preset verification

Generated from `docs/PRESET_CATALOG.md` once Epic D produces `status: "proposed"` presets. One row per preset: slot used, uploaded (date), each FX slot audibly does what its label says, params read back equal the source, notes, verdict, tester.

| preset id | slot | uploaded | A | B | C | D | readback match | notes | verdict | tester |
|-----------|------|----------|---|---|---|---|----------------|-------|---------|--------|
