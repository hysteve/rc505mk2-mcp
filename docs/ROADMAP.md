# Short-term roadmap — preset refresh, portability, agent UX

> Working document for the current refresh. Stories are sized for one session each unless noted.
> Companion: [PRESET_CATALOG.md](./PRESET_CATALOG.md) (audit snapshot), `scripts/audit-presets.ts` (regenerates it).

---

## Code review summary (2026-09-12)

**State of the build:** clean tree at v0.5.0, 455 tests passing, 26 tools. The core engine (parser, generator, merge, schemas, device I/O) is solid and well tested. The problems are concentrated in three places: the bundled preset *data*, the *param-map vocabulary* that data is written against, and the *agent workflow layer* (instructions + tool descriptions + bundle prompts).

### 1. Bundled presets are mostly invalid against the current param map

`scripts/audit-presets.ts` checks every param in every bundled rack/module against `PARAM_MAP` and runs it through the real transform. Result:

| Scope | Affected | Clean |
|-------|----------|-------|
| Bundled racks | 32 / 43 | 11 |
| Bundled FX modules | 31 / 33 | `gentle-comp`, `hard-comp` |
| Local user racks | 2 / 6 | 4 |

| Failure kind | Count | What the device gets |
|--------------|-------|----------------------|
| dropped (param name unknown to `PARAM_MAP`) | 83 | template default, silently |
| coerced (enum/string not recognized) | 56 | `0` or a meaningless raw index |
| rawindex (plain number given for an enum, e.g. `LOW CUT: 200`) | 13 | enum index 29 = 12.5 kHz, not 200 Hz |
| clamped (numeric out of range) | 36 | boundary value |
| unknown effect (`GRANULAR`, `RING MOD`) | 2 | whole slot skipped |

None of this errors. The generator does `if (!def) continue;` and every enum transform falls back to `num(v)`, so a bad preset uploads "successfully" and just sounds wrong. This is the mechanism behind "it used to work better" — the bundled data and the param map drifted apart, and nothing in the pipeline notices.

Root causes, in order of blast radius:

- **EQ shelf names.** The official reference (`fx-reference.json`) names the EQ shelves `LO` and `HIGH`; `PARAM_MAP.EQ` names them `LO GAIN` and `HI GAIN`. Every bundled EQ (27 racks + 3 modules) loses both shelves. `LEVEL` is also mapped with the ±20 dB transform but the reference says 0–100, so `LEVEL: 50` clamps to +20.
- **Frequency vocabulary.** Presets write `"2.5 kHz"`, `"3 kHz"`, `"150 Hz"`; the transform only accepts the device's exact display strings (`"2.50k Hz"`, `"3.15k Hz"`, `"160 Hz"`). No nearest-match, so these coerce to tiny indices (20–40 Hz). The four `tfx-*` racks go the other way and write bare numbers (`200`, `8000`) that are used as enum indices and clamp to 12.5 kHz.
- **Dead or missing params.** `REVERB.TYPE` (used by every reverb module) does not exist on the mk2 and is not in `PARAM_MAP`, but a `reverbType` transform still exists in `transforms.ts` and `transform-meta.ts`, so `lookup_fx_params` never disagrees with the preset author. `E.LEVEL`/`D.LEVEL` are written on filters, octave, robot, transpose, beat FX where the effect has no such param.
- **Rate/time note values.** `rateValue` and `stepRateValue` are plain `num()`, so `"1/4"` becomes `1` and `"OFF"` becomes `0` (OFF happens to be 0, so that one works by accident). `TIME_NOTE_MAP` exists for delay but there is no equivalent for RATE.
- **Range disagreements to verify on device.** `DELAY.FEEDBACK` is 1–16 in both reference and map, but 4 presets write 30–70; `DYNAMICS.DYNAMICS` uses the EQ ±20 transform; `MIC TYPE` reference says `DYN57`, meta says `DYN ST`.

### 2. Bundled racks are a different format from user racks

- Bundled racks live in one 180 KB `src/data/racks.json` that tsup inlines into the JS bundle. User racks are one file each under `~/.rc505mk2/racks/`. FX modules are already per-file under `data/fx-modules/` and are copied into the `.mcpb` as data.
- `racks.json` still carries legacy UI payload from the pre-MCP app: `meta`, `sections` (with `tagColor`), `genreTemplates`, `masterSettings`. None of it is read by the server.
- `RackSchema` still requires `icon` and `inputType` (legacy UI fields); `create_rack_preset` has to backfill `icon: ''` and `inputType: 'mic'` to satisfy it. `badge` and `fxTypes` are similar leftovers.
- No bundled rack carries `schemaVersion`; none references an `fxModuleId` (all 43 hand-type every param). So the module system the docs promote is unused by the library that ships with it.
- There is no way to opt out of bundled racks short of editing source. `PresetStore` hard-codes `loadBundledRacks()`; the ID-shadowing rule means a user cannot delete or replace one either.

### 3. Agent UX pushes toward presets and takes too many hops

- `instructions.ts` says "Default to Adapt for vague genre prompts" and the `.mcpb` prompts (`load-rack-to-slot`, `adapt-genre-rack`) both start at `list_rack_presets`. Build is framed as the exception ("user says from scratch"). This is the inverse of the product goal.
- Adapt has no first-class path. To tweak a bundled rack the agent must `get_rack_preset` (returns the full hand-typed JSON), re-send all of it to `create_rack_preset` under a new id, then `build_rack_config`/`upload_memory`. There is no clone, no upload-with-overrides, no "apply rack to slot with these changes".
- Tool descriptions carry the workflow ("do not call X in Build mode", "never get_rack_preset in Build mode") — brittle prompt-engineering that fights the model instead of making the right path the short one.
- Validation is asymmetric: placement rules (Slot A specials, bank A/B) hard-fail, but param names/values are never checked at `create_rack_preset`, `build_rack_config`, or `upload_memory`. The agent can be wrong silently, then "fix" things that were never applied.
- `get_device_schema` says TFX has banks A–D while `validate-rack.ts` restricts to A/B. Contradictory answers to the same question.
- Two build paths (`build_rack_config` → `generate_memory` → `upload_memory` vs `upload_memory { rack_id }`) plus `resolve_rack`, `save_memory_config`, `list/get_memory_configs` = surface area the agent has to reason about on every request.

### 4. No verification loop

- `param-map.ts` header: "Tag letters … MUST be verified on device using the test harness." No harness exists in the repo. There is no per-preset verification status, no QA checklist, and no batch-upload path for testing a set of presets.

---

## Progress log

**2026-09-12 (session 1)** — A1, A2, B1, B2 (frequencies), B3, B4 landed; 537 tests green; build green.

- `scripts/audit-presets.ts` rewritten on top of the new shared validator (`src/params/validate-params.ts`); `npm run audit:presets` exits 1 while any bundled preset has issues, `npm run catalog:presets` regenerates `PRESET_CATALOG.md`.
- EQ shelves are `LO` / `HIGH` (reference names); `LO GAIN` / `HI GAIN` accepted as input aliases via `src/params/param-aliases.ts`, never emitted.
- Frequencies snap: `"2.5 kHz"`, `"3 kHz"`, `"150 Hz"`, `"8000"`, `"1k"` all resolve to the nearest device step. Lookup metadata now lists the parser's own spelling (`2.50 kHz`, not `2.50k Hz`).
- Dead `REVERB.TYPE` vocabulary removed; `GRANULAR` and `RING MOD` resolve; `ELECTRIC.SCALE` accepts the guide's `C (Am)` spelling.
- `test/param-vocabulary.test.ts` pins: every reference effect resolves, param names match the reference (3 allow-listed deviations, each with a reason), every enum in the lookup metadata is in true RC0 index order forward and reverse, every documented alias is accepted.
- Audit after the map fixes: **101 issues** (was 190) across 27/43 racks and 30/33 modules — all remaining issues are preset-data problems for Epic D (params the effect does not have, 0–100 values in ±20 fields, out-of-range times, made-up enum names).

**Findings from the factory template (`test/fixtures/default.rc0`) that need the device (B5 / E1):**

| Question | Template evidence | Working assumption |
|----------|-------------------|--------------------|
| `EQ.LEVEL` range | tag E defaults to 20 in a 0–40 field, same as the four gains | ±20 dB (map was right, `fx-reference.json` corrected with a note) |
| `DYNAMICS.DYNAMICS` range | tag B defaults to 20 | ±20 (map right) |
| `DELAY.FEEDBACK` range | tag B defaults to **20**, which a 1–16 range cannot express | Decision says 1–16; the template disagrees — **verify first, before re-authoring any delay** |
| RATE encoding (filters, mod FX, slicers) | defaults are 3 (LPF/HPF/BPF/PHASER), 2 (FLANGER), 6 (ISOLATOR, both slicers), 64 (CHORUS/VIBRATO/AUTO PAN), 99 (TREMOLO) | Consistent with **note values first** (`4MEAS,2MEAS,1MEAS,1/2,1/2.,1/2T,1/4,…,1/32` = 0–13) then numeric 0–100 at 14–114: slicers default `1/4`, filters `1/2`, chorus/pan `50`. If true, every numeric RATE the generator writes today is off by 14. Validator warns on note-value rates until verified. |
| RATE encoding, second data point | TREMOLO default RATE is stored as **99**; the guide says the default is **85**. 99 − 14 note entries = 85 | strongest evidence for notes-first; still needs readback |
| `DELAY.TIME` ms offset | default 200 ms is stored as **211**; `delayTime` writes ms + 10 = 210 | possible off-by-one (12 note entries, not 11?) — verify with 300 ms |
| `BEAT_REPEAT/SCATTER.LENGTH`, `BEAT_SHIFT.SHIFT` | guide: `THRU, note values`; map uses a plain number, so `1/16` writes `1` | encoding unknown — verify |
| `ROLL2.REPEAT` | guide: `1–100, INF`; map has no `INF` | verify stored value for INF |
| `TREMOLO` 4th param | tag D exists in template, not in guide | keep `LEVEL` in map, allow-listed |
| `TAPE ECHO` labels | guide says REPEAT RATE / INTENSITY | map keeps TIME / FEEDBACK, allow-listed |

The device checklist for all of the above is [QA_GRID.md](./QA_GRID.md) Part 1 — five scratch slots (95–99), one pass. **Status: waiting on hardware readback.**

---

## Epics

| Epic | Goal | Stories |
|------|------|---------|
| **A. Audit & guardrails** | Make preset invalidity impossible to ship silently | A1–A4 |
| **B. Param-map correctness** | Code vocabulary matches the official reference and the device | B1–B5 |
| **C. Portable bundled presets** | Bundled racks are plain files, same schema as user racks, optional | C1–C5 |
| **D. Preset refresh** | Every preset re-authored against the corrected map, using modules | D1–D3 |
| **E. Device QA grid** | Manual on-device verification, tracked per preset, gating release | E1–E4 |
| **F. Agent UX** | Build-first, fewer hops, validation up front | F1–F6 |
| **G. Docs & release** | Ship an honest 0.6.0 | G1–G2 |

Suggested order: **A1 → B (all) → C1–C3 → A2–A3 → F1–F3 → D → E → C4–C5 → F4–F6 → G**. B must land before D (no point re-authoring presets against a wrong map). E gates the release.

---

## Epic A — Audit & guardrails

### A1. Preset audit script lives in the repo
*As a maintainer I can run one command that lists every param in every preset that would be dropped, coerced, or clamped.*

- [x] `scripts/audit-presets.ts` exists, runs with `npx tsx`, and covers bundled racks, bundled modules, and `~/.rc505mk2` user presets.
- [x] `npm run audit:presets` script added to `package.json`.
- [x] Output groups by preset and reports totals by kind; exit code is non-zero when any bundled preset has issues.
- [x] `docs/PRESET_CATALOG.md` regenerates from the script output (`npm run catalog:presets`).

### A2. Shared validator used by audit, tools, and tests
*As the server I validate params the same way everywhere.*

- [x] New `src/params/validate-params.ts` exporting `validateSlotParams(effect, params) → { effect?, issues[] }` (each issue has `level`, `kind`, `outcome`, `message`, optional `suggestion`) using `PARAM_MAP` + `TRANSFORM_META` + the real transforms.
- [x] Distinguishes: unknown effect (error), unknown param, unrecognized enum value (with nearest suggestion), raw enum index, out-of-range numeric (with clamp result), unsupported note-value rate.
- [x] `scripts/audit-presets.ts` is rewritten to call it (no duplicated logic).
- [x] Unit tests cover each issue kind and the "alias accepted by transform" case (`DYN57` → ok, `COMBO` → warning).

### A3. CI fails on invalid bundled presets
- [ ] New `test/bundled-presets.test.ts` loads every bundled rack and module and asserts zero errors and zero warnings from A2.
- [ ] Test is skipped-with-reason for presets explicitly marked `status: "draft"` (see C2) so unfinished work can be committed without shipping.
- [ ] Runs in the existing CI workflow.

### A4. Generator refuses to silently drop
- [ ] `memoryConfigToRc0Pair` collects unknown-param and unknown-effect events instead of `continue`-ing silently.
- [ ] `generate_memory` and `upload_memory` return a `warnings` array in their result; an `strict: true` option turns warnings into an error before anything is written to the device.
- [ ] CLI `generate`/`upload` print warnings to stderr.

### A5. Typecheck is clean and enforced
*`npx tsc --noEmit` reports 7 errors on `main` today (pre-existing, unrelated to the refresh); the tsup build does not catch them.*

- [ ] Fix: `schemaVersion` default vs required in `handlers-preset.ts` (create module/rack) and `share/extract.ts`; `build_rack_config` slot arrays typed as `Record<string, unknown>[]`; impossible `slot.bank !== ''` comparison in `validate-rack.ts`.
- [ ] `npm run typecheck` script added and run in CI before tests.

---

## Epic B — Param-map correctness

All B stories: change `param-map.ts`/`transforms.ts`/`reverse-transforms.ts`/`transform-meta.ts` together, add a round-trip test, and add a row to the QA grid (E1) because the tag-letter → device mapping still needs a hardware check.

### B1. EQ param names and ranges match the reference
- [x] `PARAM_MAP.EQ` keys are `LO`, `LO-MID GAIN`, `LO-MID FREQ`, `LO-MID Q`, `HI-MID GAIN`, `HI-MID FREQ`, `HI-MID Q`, `HIGH`, `LEVEL` (exact reference names). `LO GAIN`/`HI GAIN` remain as accepted aliases on input and are never emitted by the parser.
- [x] ~~`LEVEL` uses a 0–100 transform~~ — reversed: the template proves LEVEL is ±20 dB centred; `fx-reference.json` corrected instead (see progress log).
- [x] `lookup_fx_params EQ` returns the reference names.
- [x] Round-trip test: generate → parse yields the same names/values.

### B2. Frequency and note-value inputs accept human forms
- [x] `lowCut`/`highCut`/`eqFreq` accept `"2.5 kHz"`, `"2500"`, `"2.5k"`, `"2.50k Hz"` and snap to the nearest device step; exact strings still round-trip unchanged. Bare integers ≤ 29 keep raw-index behaviour.
- [ ] **Blocked on device (E1):** `rateValue`/`stepRateValue` note values. The template suggests note values are encoded *before* the numeric range (see progress log), which would also mean numeric rates are currently mis-encoded. Do not implement until read back from hardware. Validator warns on note-value rates meanwhile.
- [x] `TRANSFORM_META` for frequencies lists the accepted forms (`aliases`) so `lookup_fx_params` tells the agent the truth.
- [x] Tests for each accepted form and for the snap behaviour.

### B3. Remove dead vocabulary, add missing effects
- [x] `reverbType` transform + meta removed (no `TYPE` on mk2 REVERB); `GATE_REVERB` has no `TYPE`/`DENSITY`.
- [x] `EFFECT_NAME_MAP` gains `GRANULAR` → `GRANULAR_DELAY`, `RING MOD` → `RING_MODULATOR`; every display name in `fx-reference.json` already resolved.
- [x] A test asserts every effect in `fx-reference.json` resolves through `EFFECT_NAME_MAP` to a `PARAM_MAP` key, and every `PARAM_MAP` param name exists in the reference for that effect (allow-list for deliberate deviations, each with a comment).

### B4. `lookup_fx_params` vocabulary equals transform vocabulary
- [x] `TRANSFORM_META` enum lists are asserted (test) to be in RC0 index order for both forward and reverse transforms; legacy spellings are exposed as `aliases` and tested to resolve. `MIC TYPE` keeps the device labels (`DYN ST`, marked device-verified in the transform) with the guide's `DYN57` spellings as aliases.
- [ ] `list_fx_types` marks params that are TFX-only or context-dependent.

### B6. Note-length and special-value encodings (blocked on QA grid Part 1)
- [ ] `rateValue` / `stepRateValue`: note values first-class, numeric offset corrected per readback; reverse transforms emit note strings; `TRANSFORM_META` lists them.
- [ ] New `beatLength` transform (+ reverse, + enum meta with `THRU` and notes) for `BEAT_REPEAT.LENGTH`, `BEAT_SCATTER.LENGTH`, `BEAT_SHIFT.SHIFT`.
- [ ] `ROLL.REPEAT` accepts `INF`; `delayTime` / `rollTime` ms offset corrected if the 300 ms readback says so.
- [ ] `TAPE_ECHO` params renamed to the on-screen labels (`REPEAT RATE` / `INTENSITY`) with `TIME` / `FEEDBACK` as aliases, if the device confirms; allow-list entry removed.
- [ ] Every change gets a round-trip test and its QA grid row marked verified.

### B5. Range disagreements resolved on device (blocked on QA grid Part 1)
- [ ] **Decision (2026-09-12): `DELAY.FEEDBACK` stays 1–16.** Presets writing 30–70 are wrong and get re-authored; confirm on device as part of E1 anyway.
- [ ] `DYNAMICS.DYNAMICS` (±20 vs 0–100), `EQ.LEVEL`, `PREAMP.MIC POS`, `LO-FI.BITDEPTH`, RATE/STEP RATE note-value encoding verified by reading a slot set on the device and confirming the parsed value.
- [ ] Findings recorded in `fx-reference.json` `notes` and in the QA grid.

---

## Epic C — Portable bundled presets

### C1. Bundled racks become one file each
*As a user I can add or remove a bundled rack by moving a file.*

- [ ] `src/data/racks.json` is split into `data/racks/{id}.json`, one rack per file, and deleted along with `load-racks.ts`'s JSON import.
- [ ] Legacy top-level keys (`meta`, `sections`, `genreTemplates`, `masterSettings`) are dropped; anything worth keeping moves to docs.
- [ ] `RackStore` is used for both bundled (`data/racks/`, read-only) and user (`~/.rc505mk2/racks/`) directories; `PresetStore` merges them exactly as it already does for FX modules.
- [ ] `pack-mcpb.ts` and `package.json.files` already include `data/`; `npm-pack.test.ts` extended to assert racks load after pack install.
- [ ] `_meta.json` for racks mirrors the modules one.

### C2. One rack schema, versioned
- [ ] `RackSchema` v2: `icon`, `inputType`, `badge`, `fxTypes` become optional (or removed); `schemaVersion` required on write; new optional `status: "draft" | "proposed" | "verified"` and `verification: { device, firmware, date, by, notes }`.
- [ ] Migration v1 → v2 in `document-version.ts` (fills `schemaVersion`, drops removed fields, sets `status: "draft"` when absent).
- [ ] Bundled and user files are byte-for-byte the same shape; `create_rack_preset` no longer backfills legacy fields.
- [ ] Tests: v1 file migrates; v2 file round-trips; bundled files all parse as v2.

### C3. Bundled presets are optional and replaceable
- [ ] `RC505MK2_BUNDLED_RACKS=off` (and `..._MODULES=off`) disables loading; `RC505MK2_BUNDLED_DATA` already redirects the directory.
- [ ] User rack with the same id shadows the bundled one (already true) **and** `delete_rack_preset` on a bundled id writes a tombstone in `~/.rc505mk2/disabled.json` instead of erroring, so a user can hide a bundled preset from the agent.
- [ ] `list_rack_presets` / `list_fx_modules` results carry `source: "bundled" | "user"` (already) and `status`.
- [ ] README documents "to remove bundled presets, delete or move files out of `data/racks/`" for source installs and the env var for `.mcpb` installs.

### C4. Bundled presets use modules
- [ ] Each re-authored rack (D2) references `fxModuleId` where a module exists and carries only `overrides`; `resolve_rack` output equals the old hand-typed params after B fixes.
- [ ] A test asserts every `fxModuleId` in bundled racks resolves.

### C5. Export/import a preset pack
- [ ] `export_zip` gains `kind: "presets"` producing a zip of rack + module JSON (not RC0); `import_zip` detects it and writes into the user store.
- [ ] Documented in SHARING.md as the portable unit for sharing a set of racks.

---

## Epic D — Preset refresh

### D1. Triage the catalog
- [ ] Each of the 43 racks and 33 modules in `PRESET_CATALOG.md` gets a decision: **keep** (re-author), **merge** (fold into another), or **drop**.
- [ ] **Decision (2026-09-12): merge aggressively, but preserve each rack's core idea.** Fewer racks is fine; losing a distinct concept (e.g. telephone voice, whisper-to-scream dynamics, voice-to-bass) is not. Merge when two racks are the same idea with different numbers. Every kept rack has its param config reconsidered from scratch against the corrected map, not just patched.
- [ ] Dropped ids are listed in CHANGELOG so anyone who referenced them knows.

### D2. Re-author every kept preset against the corrected map
- [ ] Every param name is a `PARAM_MAP` key; every value passes A2 with zero warnings.
- [ ] Frequencies use device steps; rates use note values where tempo sync is intended; `E.LEVEL`/`D.LEVEL` only where the effect has them.
- [ ] Racks reference modules (C4); modules set every param the effect has (no partial coverage relying on template defaults) unless the omission is deliberate and commented in `description`.
- [ ] Each preset has at least one `tips` entry and a `status: "proposed"`.
- [ ] Proposed configs are reviewed in a PR per section (vocals, guitar, beatbox, tfx) with the audit output attached.

### D3. Author-facing param cheat-sheet
- [ ] `docs/PARAMS.md` generated from `PARAM_MAP` + `TRANSFORM_META`: effect, param, accepted values/ranges, aliases. Linked from CONTRIBUTING for anyone writing preset JSON by hand.

---

## Epic E — Device QA grid

### E1. QA grid document
- [x] `docs/QA_GRID.md` created with Part 1 (encoding checks, slots 95–99) and the Part 2 skeleton.
- [ ] Part 2: one row per preset (racks + modules) with columns: slot used, uploaded (date), audible check per slot (A/B/C/D), params read back match, notes, verdict (pass/fail/needs-rework), tester.
- [ ] A second table for param-map checks (B5 items and every tag-letter assumption in `param-map.ts`): effect, param, value sent, value shown on device screen, value parsed back.
- [ ] Generated skeleton from the catalog so rows are never hand-typed.

### E2. Batch upload for testing
- [ ] CLI `rc505mk2 qa upload --from <slot> [--section vocals] [--ids a,b,c]` uploads N presets to consecutive slots with names prefixed `QA-`, prints the slot ↔ preset table, backs up as usual, ejects once at the end.
- [ ] `rc505mk2 qa readback --from <slot> --count N` reads those slots and diffs parsed params against the source preset (post-B fixes this should be an exact match; differences are B5 findings).
- [ ] Both commands refuse to run without an explicit `--yes` and print the slots they will overwrite first.

### E3. Verification is recorded in the preset file
- [ ] Passing a QA row updates the preset's `status` to `verified` and fills `verification` (C2) via `rc505mk2 qa mark <id> --pass --by <name>`.
- [ ] `list_rack_presets` / `list_fx_modules` expose `status`; the agent instructions say to prefer `verified` presets when in Adapt mode and to tell the user when a preset is `proposed`.

### E4. Release gate
- [ ] A3's CI test additionally fails if any bundled preset has `status` other than `verified` when `RELEASE=1` (set by the release-please workflow).
- [ ] CHANGELOG for 0.6.0 lists verified presets and drops.

---

## Epic F — Agent UX

### F1. Build-first instructions
- [ ] `instructions.ts` rewritten: default mode is **Build** (compose from modules); **Adapt** is offered only when the user names a bundled preset or asks for "something like X"; `list_rack_presets` is presented as a browse tool, not a starting point.
- [ ] Remove "Default to Adapt for vague genre prompts". Remove tool-name prohibitions ("never get_rack_preset in Build mode"); replace with the short happy path.
- [ ] `.mcpb` prompts updated: `build-custom-rack` is first; `adapt-genre-rack` renamed to `browse-presets`.
- [ ] `mcp-instructions.test.ts` updated to assert the new defaults.

### F2. One-call create-and-upload
*As an agent I can go from module ids to a slot on the device in one tool call.*

- [ ] `upload_memory` accepts the same `inputFx`/`trackFx` slot arrays as `create_rack_preset` (module ids + overrides) in addition to `rack_id`/`config`; optional `save_as: { title, tags }` persists the rack as a side effect and returns `rack_id` + `file_path`.
- [ ] Validation (A2) runs before any device write and the result includes `warnings`.
- [ ] Happy path for "build me a vocal rack and put it on slot 5" is: `list_fx_modules` → `upload_memory`. Two calls.

### F3. Adapt has a real path
- [ ] `clone_rack_preset { rack_id, new_title, overrides?: { inputFx?, trackFx? } }` copies a bundled or user rack into the user store applying per-slot overrides (by slot/bank), returning the new rack. No need to echo the whole JSON back.
- [ ] `upload_memory { rack_id, overrides }` applies the same overrides transiently without saving.
- [ ] Happy path for "put the vocal plate rack on slot 3 but with a longer reverb": `upload_memory` with `rack_id` + one override. One call (two if the agent lists first).

### F4. Validate at the boundary, with helpful errors
- [ ] `create_rack_preset`, `update_rack_preset`, `clone_rack_preset`, `build_rack_config`, `upload_memory` all run A2. Unknown effect → error. Unknown param / bad value → returned as `warnings` with the nearest accepted value; `strict: true` promotes to error.
- [ ] Error text names the accepted values inline so the agent does not need a second `lookup_fx_params` round-trip.
- [ ] `get_device_schema` and `validate-rack.ts` agree on TFX banks (pick one; document why).

### F5. Trim the tool surface
- [ ] Merge `resolve_rack` into `get_rack_preset { resolved: true }`.
- [ ] `build_rack_config` + `generate_memory` collapse into `generate_memory { rack_id | config | slots }`; `build_rack_config` kept as a deprecated alias for one release.
- [ ] Tool descriptions lose workflow prose and keep: what it does, required inputs, what it returns. Workflow lives only in `instructions.ts`.
- [ ] Target ≤ 20 tools. Update `UNIFIED_MCP_TOOLS.md` and README counts.

### F6. Prompt regression suite
- [ ] `docs/TEST_PROMPTS.md` reorganized Build-first with expected tool sequence and max call count per prompt.
- [ ] A markdown table in the same file records the last manual run (date, model, pass/fail per prompt) so UX regressions are visible, the same way the QA grid tracks device results.

---

## Epic G — Docs & release

### G1. Docs match the code
- [ ] README/CONCEPTS/ARCHITECTURE/UNIFIED_MCP_TOOLS: preset counts, tool list, storage layout (`data/racks/`), opt-out instructions, verification statuses, Build-first workflow.
- [ ] CONTRIBUTING: "adding a preset" section — write JSON, run audit, open PR, QA grid row, mark verified.

### G2. 0.6.0
- [ ] Only `verified` presets ship; `proposed` ones may ship behind `status` with the agent told to warn.
- [ ] `.mcpb` manifest version bumped by `prep:release` (it still says 0.4.0 while the package is 0.5.0); CHANGELOG generated.
- [ ] Tool count reconciled: docs say 26, `tools.ts` defines 27 (`get_device_schema` was added in 0.5.0).

---

## Acceptance criteria for the refresh as a whole

1. `npm run audit:presets` reports zero issues for every bundled preset, and CI enforces it.
2. Every bundled rack and module is a standalone JSON file with `schemaVersion: 2` and a `verification` block filled from an on-device test.
3. Removing bundled presets is a file move (source) or an env var (`.mcpb`); a user rack with the same id wins.
4. "Build me an X rack and upload it to slot N" completes in ≤ 3 tool calls; "put bundled rack Y on slot N with change Z" in ≤ 2.
5. No tool call can write a param to the device that the server knows is invalid without returning a warning naming it.
