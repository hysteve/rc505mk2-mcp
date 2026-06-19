# RC-505mk2 MCP — Agent Skill

> Teach LLMs to use the `rc505mk2` MCP server efficiently and correctly.
> Read this before calling tools for FX racks, memory presets, or device upload.

---

## When to use

Use the `rc505mk2` MCP tools when the user wants to:

- Browse or create FX modules and rack presets
- Build a memory config for a specific slot (1–99)
- Generate RC0 files or upload to a connected RC-505mk2
- Understand IFX/TFX placement, sequencer params, or upload merge behavior

**Do not** guess parameter names or rack JSON shapes — use the tools and templates below.

**Call MCP tools directly by name** — never meta-search, scan, or guess tool names. If you need racks, call `list_rack_presets`. If you need modules, call `list_fx_modules`.

---

## Adapt vs Build (pick one per request)

| Mode | When | First tool | Goal |
|------|------|------------|------|
| **Adapt** | Vague genre/style ("R&B performance rack", "DnB drums") — user did **not** ask for from-scratch | `list_rack_presets` (filter genre/tag/section) | Find closest bundled rack → adapt, save, or upload |
| **Build** | User says **from scratch**, **custom**, **greenfield**, **don't use bundled**, or **compose from modules** | `list_fx_modules` (`context: "ifx"` then `"tfx"`) | Pick modules by description/tags/pairsWith → `fxModuleId` chain → `create_rack_preset` |

**Build mode constraints (never violate):**

- Do **not** call `list_rack_presets` or `get_rack_preset` — even if `create_rack_preset` fails
- If create fails because rack id exists → `update_rack_preset` with the same chain **or** retry `create_rack_preset` with a new title/id
- After `list_fx_modules`, call `create_rack_preset` **directly** — never meta-search for tools

Do **not** ask clarifying questions when the prompt already implies the mode (e.g. "modern R&B performance" → Adapt; try vocal/neo-soul tags before asking).

---

## FX module categories (generic guide)

Use with `list_fx_modules` — each module also has its own `description`, `tags`, and `pairsWith`.

| Category | Typical role | Common in |
|----------|--------------|-----------|
| **dynamics** | Glue, punch, leveling (compression, limiting, gating) | IFX first-in-chain |
| **tone** | EQ, filtering, warmth, clarity | IFX or TFX |
| **space** | Reverb, delay, ambience | IFX (capture) or TFX (performance wash) |
| **time** | Delays, echoes, rhythmic space | IFX or TFX |
| **transition** | Builds, drops, filter sweeps | TFX performance |
| **performance** | Stutter, glitch, beat FX, DJ tools | TFX (special FX = Slot A only) |
| **character** | Saturation, lo-fi, grit, radio | IFX or TFX |
| **pitch** | Harmonizing, vocoder, transpose | IFX vocals |
| **modulation** | Phaser, chorus, tremolo, movement | TFX or IFX color |

Prefer **`fxModuleId`** from `list_fx_modules` over hand-typed params. Use **`pairsWith` from the list response** to chain modules (e.g. gentle-comp → warm-eq → vocal-plate) — it is authoritative; **do not** call `get_fx_module` just to read pairings. Call `get_fx_module` only when you need full param lists or specific override values.

---

## Lessons from real MCP sessions

These patterns caused extra tool calls, validation errors, or hardware-rule mistakes in early testing:

| Problem | Fix |
|---------|-----|
| Meta-searched for tools instead of calling them | Call `list_rack_presets` or `list_fx_modules` **directly** — never "search for tools" |
| Build mode: `create_rack_preset` failed (duplicate id) → `get_rack_preset` | Use `update_rack_preset` or a **new title** — never browse presets in Build mode ([Test Run 3](./MCP%20Test%20Run%203%20-%20Claude%20Sonnet%204.md)) |
| Called `get_fx_module` only to read pairsWith | `list_fx_modules` already returns `pairsWith` — skip extra get unless you need full params |
| Built from scratch when Adapt would work | Default to Adapt for genre prompts; use Build only when user asks for greenfield |
| Built a rack without checking bundled presets (Adapt mode) | `list_rack_presets` filtered by genre/tag/section first |
| `create_rack_preset` failed: tips must be objects | Tips are `{ type, title, text }` — never plain strings (see template below) |
| Fetched a bundled rack just to learn JSON shape | Use the rack template in this doc; call `get_rack_preset` only when adapting |
| Many sequential `list_fx_types` / `lookup_fx_params` calls | `list_fx_modules` includes descriptions; batch `lookup_fx_params` only for manual overrides |
| Placed BEAT_SCATTER in TFX Slot C | Special Track FX **must** be TFX Slot A — one per bank |
| User said "upload it" but agent asked for slot again | Ask memory slot **once** when upload is likely |
| Used `build_rack_config` before upload | Prefer `upload_memory { rack_id, slot_number }` |

---

## Hardware model (must know)

### Input FX (IFX) vs Track FX (TFX)

| | Input FX (IFX) | Track FX (TFX) |
|---|----------------|----------------|
| **When applied** | Live, on mic/line input **before** recording | On **recorded loops** during playback |
| **Use case** | Shape what gets captured (comp, EQ, reverb on vocals going in) | Performance/DJ effects on loops (stutter, filter sweeps, glitch) |
| **Slots** | A, B, C, D (one chain) | Banks **A** and **B**, each with slots A, B, C, D |
| **Special FX** | BEAT_SCATTER, BEAT_REPEAT, BEAT_SHIFT, VINYL_FLICK **not available** | Same four effects — **TFX Slot A only**, max one per bank |

Filter tools with `list_fx_types`: pass `context: "ifx"` or `context: "tfx"` to avoid irrelevant types.

### Track FX: bank vs slot (common mistake)

The RC-505 has **two Track FX banks** (A and B). Each bank has **four slots** (A, B, C, D).

| Field | Meaning | Values |
|-------|---------|--------|
| `bank` | Which performance bank | `"A"` or `"B"` only |
| `slot` | Position within that bank | `"A"`, `"B"`, `"C"`, or `"D"` |

Three modules in **one** bank (e.g. breakdown chain):

```json
{ "slot": "A", "bank": "A", "fxModuleId": "hpf-sweep", "params": [] },
{ "slot": "B", "bank": "A", "fxModuleId": "reverse-reverb-swell", "params": [] },
{ "slot": "C", "bank": "A", "fxModuleId": "echo-fadeout", "params": [] }
```

Do **not** use bank `"C"`/`"D"` or spread modules across fake "banks" — there are only two banks.

### fxModuleId slots (Build mode)

When using `fxModuleId` from `list_fx_modules`:

- Copy `effect` from the list response, **or omit it** — the server fills it from the module
- Set `params: []` — params inherit from the module; use `overrides` only for changes (numbers OK — server coerces to strings)
- Do **not** call `lookup_fx_params` or `get_fx_module` just to fill effect/params
- **Omit `sequencer`** unless you need 16-step modulation — never send `sequencer: {}`

```json
{ "slot": "A", "bank": "A", "label": "Sweep", "fxModuleId": "hpf-sweep", "params": [] }
```

### Special Track FX rule (critical)

These four effects can **only** occupy **Track FX Slot A** within a bank, and only **one** per bank:

- `BEAT_SCATTER`
- `BEAT_REPEAT`
- `BEAT_SHIFT`
- `VINYL_FLICK`

Valid: Bank A Slot A = BEAT_SCATTER, Bank B Slot A = BEAT_REPEAT.  
Invalid: BEAT_SCATTER in Slot B/C/D, or two special FX in the same bank.

Bundled reference rack: `tfx-beat-mangle` demonstrates correct placement.

### FX naming

- MCP reference tools use **underscores**: `BEAT_SCATTER`, `LO_FI`, `GATE_REVERB`
- Bundled rack JSON often uses **spaces**: `BEAT SCATTER`, `LO-FI`
- Both work in rack presets; `lookup_fx_params` expects underscores (`fx_name: "BEAT_SCATTER"`)

---

## Tool call budget (stay efficient)

### Adapt: genre/style rack (default)

```
list_rack_presets { genre | tag | section }  →  get_rack_preset (if adapting)
create_rack_preset OR update_rack_preset OR use rack as-is
upload_memory { rack_id, slot_number }
```

**3–5 calls.** Call `list_rack_presets` immediately — do not search for tools first.

### Build: from scratch via modules

```
list_fx_modules { context: "ifx", tag: "..." }
list_fx_modules { context: "tfx", tag: "..." }
create_rack_preset  (fxModuleId per slot, pairsWith for chain ideas)
upload_memory { rack_id, slot_number }   # optional
```

**3–4 calls** to save a rack. Skip `list_rack_presets` entirely in Build mode.

### Load bundled rack → device slot N

```
list_rack_presets  →  get_rack_preset (optional inspect)
detect_device
upload_memory      { rack_id, slot_number: N, mode: "merge" }
```

**3–4 calls.** Prefer `rack_id` on `upload_memory` — do not call `build_rack_config` first unless you need to inspect the MemoryConfig.

### Customize or create a rack, then upload

```
list_rack_presets / list_fx_modules     → find starting point
lookup_fx_params                        → only for FX you are setting by hand
create_rack_preset OR update_rack_preset
upload_memory  { rack_id, slot_number: N }
detect_device → eject_device if needed
```

**Ask slot number early** if the user mentions uploading or "put it on the device."

### Create rack from user description (no upload)

```
list_rack_presets (genre/tag match)  →  adapt OR create_rack_preset
resolve_rack (optional preview)
```

Offer upload as a follow-up; if accepted, you already know the workflow.

---

## Workflows

### 1. "Load vocal plate rack to slot 5"

```
list_rack_presets { tag: "vocals" }   # or section: "reverb"
get_rack_preset { rack_id: "..." }    # optional
detect_device
upload_memory { rack_id: "...", slot_number: 5, name: "VOCAL PLATE" }
```

Preset names are max **12 ASCII characters**.

### 2. "Create an FX rack for DnB drum processing" (Adapt)

1. `list_rack_presets { genre: "DnB" }` or `{ tag: "drums" }` / `{ section: "percussion" }`
2. If a close match exists (e.g. `tfx-beat-mangle`), `get_rack_preset` → adapt or upload as-is
3. Else Build: `list_fx_modules` for IFX + TFX → `create_rack_preset` with `fxModuleId`s
4. Offer upload: `upload_memory { rack_id, slot_number }`

### 2b. "Build a custom R&B vocal rack from scratch" (Build)

1. `list_fx_modules { context: "ifx", tag: "vocals" }` — read descriptions and pairsWith (no `get_fx_module`)
2. `list_fx_modules { context: "tfx", tag: "performance" }` or `{ category: "transition" }`
3. `create_rack_preset` referencing module IDs (gentle-comp, warm-eq, vocal-plate, etc.) — call directly, no tool meta-search
4. If duplicate id error → `update_rack_preset` or new title; **never** `get_rack_preset`
5. Do **not** call `list_rack_presets` unless user asks to compare with bundled options

### 3. "What's on my device?" (read slot)

```
detect_device
# Read MEMORY00NA.RC0 from device ROLAND/DATA path (manual today)
parse_memory { xml, slot_number: N }
```

Future: `read_device_slot` (Phase 4).

### 4. Save config without device

```
build_rack_config { rack_id, slot_number: N }
save_memory_config { config }
# OR
generate_memory { config }   → returns base64 RC0 A+B pair
```

---

## Data shapes

### Rack preset template

Required fields for `create_rack_preset`: `title`, `genres`, `inputFx`, `trackFx`.

Optional fields get sensible defaults: `section: "custom"`, `inputType: "mic"`, `icon: ""`, `description: ""`, `tips: []`.

```json
{
  "title": "DnB Drum Processor",
  "genres": ["DnB", "Jungle"],
  "section": "percussion",
  "inputType": "mic",
  "description": "Input shaping + performance glitch TFX for breaks.",
  "inputFx": [
    {
      "slot": "A",
      "label": "Glue",
      "effect": "DYNAMICS",
      "fxModuleId": "gentle-comp",
      "params": [],
      "overrides": [{ "name": "GAIN", "value": "10" }]
    }
  ],
  "trackFx": [
    {
      "slot": "A",
      "bank": "A",
      "label": "Scatter",
      "effect": "BEAT SCATTER",
      "params": [
        { "name": "TYPE", "value": "P2" },
        { "name": "LENGTH", "value": "12" }
      ]
    },
    {
      "slot": "B",
      "bank": "A",
      "label": "Stutter",
      "effect": "ROLL",
      "params": [
        { "name": "ROLL", "value": "1/16" },
        { "name": "REPEAT", "value": "70" }
      ]
    }
  ],
  "tips": [
    {
      "type": "tip",
      "title": "Special TFX Rule",
      "text": "BEAT SCATTER is in Bank A Slot A (required). Swap for BEAT REPEAT if you prefer stutter fills — only one special TFX per bank."
    },
    {
      "type": "performance",
      "title": "Glitch Fill",
      "text": "Engage Scatter on the drop; use Roll for rapid stutter. Switch to Bank B for alternate performance FX."
    }
  ],
  "tags": ["DnB", "drums", "tfx"]
}
```

**Tips `type` values:** `tip` | `performance` | `how` | `warning`

**Slots:** IFX uses `slot` only. TFX uses `slot` + `bank` (`"A"` or `"B"`).

**Params:** When using `fxModuleId`, provide `overrides` for changed params; `params` can be empty and will resolve at generation time. When not using a module, `params` must be complete — call `lookup_fx_params` first.

### Pre-flight checklist (before `create_rack_preset`)

- [ ] Every `tips[]` entry is `{ type, title, text }` — not a string
- [ ] IFX effects are not TFX-only (BEAT_*, VINYL_FLICK) — **server rejects invalid placement**
- [ ] Each special Track FX is in TFX **Slot A** of its bank, max one per bank — **server rejects invalid placement**
- [ ] Param values match `lookup_fx_params` enums/ranges
- [ ] Sequencer steps use the same value type as the selected TARGET param

---

## Sequencer rules

15 FX types have a `_SEQ` variant with a 16-step parameter sequencer.

1. `list_fx_types` → check `sequencer.available` and `sequencer.targets`
2. `lookup_fx_params` → read `sequencer.targets[]` with `stepValueType` per target
3. Set `TARGET` to the **0-based index** of the param to modulate
4. `STEP 1`–`STEP 16` values must match that target's type/range (e.g. TRANSPOSE TRANS = −12 to +12 semitones)
5. Control params: `SW`, `SYNC`, `RETRIG`, `SEQ RATE`, `SEQ MAX` (1–16)

Put sequencer params in the slot's `sequencer` array alongside `params`.

---

## Upload: merge vs overwrite

| Mode | Behavior | When to use |
|------|----------|-------------|
| **`merge`** (default) | Reads existing slot from device; incoming FX banks/settings replace only what you provide; rest preserved | Updating FX racks on a memory that has tracks, rhythm, or other banks you want to keep |
| **`overwrite`** | Full slot replacement with provided config | New empty slot or intentional full reset |

Always `detect_device` before `upload_memory`. Device must be in **Storage mode**: MENU → USB → STORAGE → CONNECT.

Upload backs up existing files to `./rc505-backups/` by default. Call `eject_device` after a successful upload.

---

## Example user prompts

### Adapt mode (browse presets)

| User says | Agent does |
|-----------|------------|
| "Create an rc505 fx rack for modern R&B performance" | `list_rack_presets { genre/tag }` → adapt or build from modules if no match |
| "Create an rc505 fx rack for dnb drum processing" | `list_rack_presets { tag: "drums" }` → adapt or create |
| "Load vocal plate rack to slot 5" | `list_rack_presets` → `upload_memory { rack_id, slot_number: 5 }` |
| "Show me the stutter/glitch rack" | `list_rack_presets { tag: "glitch" }` → `get_rack_preset` |

### Build mode (modules only — no preset browse)

| User says | Agent does |
|-----------|------------|
| "Build a custom modern R&B vocal rack from scratch using FX modules — don't use bundled rack presets" | `list_fx_modules` ifx+tfx → `create_rack_preset` with fxModuleIds |
| "Design a new performance rack for live looping: pick modules by purpose, reference fxModuleIds, save as new rack" | `list_fx_modules` → compose → `create_rack_preset` |
| "Create an original IFX chain for silky R&B vocals using gentle-comp, warm-eq, and vocal-plate — greenfield" | `list_fx_modules` (verify IDs) → `create_rack_preset` |

### Other

| User says | Agent does |
|-----------|------------|
| "What reverbs work on input vs track FX?" | `list_fx_types { context: "ifx" }` and `{ context: "tfx" }` |
| "Upload my custom rack to slot 3" | `upload_memory { rack_id, slot_number: 3 }` |
| "Merge new TFX into slot 2 without losing my tracks" | `upload_memory { rack_id, slot_number: 2, mode: "merge" }` |
| "Generate RC0 for slot 7 but don't upload" | `build_rack_config` → `generate_memory` |
| "Is my 505 connected?" | `detect_device` |

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [UNIFIED_MCP_TOOLS.md](./UNIFIED_MCP_TOOLS.md) | Full tool list and storage layout |
| [LIBRARY.md](./LIBRARY.md) | Param transforms, inheritance, merge internals |
| [README.md](../README.md) | Install and MCP client config |
| [manual-test/](./manual-test/) | MCP manual test run notes |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical design |
