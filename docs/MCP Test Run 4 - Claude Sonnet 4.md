# MCP Test Run 4 - Claude Sonnet 4

> **Mode:** Build (greenfield — modules only, unique title)  
> **Skill:** Post Test Run 3 fixes (duplicate-id guidance, pairsWith skip-get, clearer create error)  
> **Verdict:** **Partial pass (live)** — duplicate-id fix validated; meta-search still occurs. Ready to merge Phase 3.

---

## Prompt

> Build a custom neo-soul vocal rack from scratch (title: "Neo Soul Live Vox 2026") — FX modules only, no bundled rack presets. IFX: compression + EQ + short reverb via fxModuleIds. TFX Bank A: filter sweep + delay throw. Save and print the slot table. Do not call get_rack_preset or list_rack_presets.

---

## Live agent result (Claude Sonnet 4)

### What went well

- **Build mode** — no `list_rack_presets` or `get_rack_preset` (explicit constraint followed)
- **Duplicate-id recovery** — `create_rack_preset` failed (rack existed from handler sim) → **`update_rack_preset`** per skill rules (Test Run 3 fix **validated**)
- **Module-driven picks** — IFX chain via `fxModuleId`; TFX chosen by reading list descriptions/categories
- **Musical judgment** — picked `rhythmic-delay` over `echo-fadeout` for “delay throw” (tempo-synced dotted-eighth vs fade-out tool)
- **IFX override** — trimmed `vocal-plate` TIME to 30 for shorter tail
- **Schema awareness** — dropped non-existent `inputType` field after seeing real schema

### Friction (same class as Run 2–3)

1. **Meta-search at start** — *"Let me start by loading the relevant tools"*
2. **Meta-search before create** — first search surfaced browse/inspect tools, not `create_rack_preset`; second search before save
3. **Extra module browse** — checked `time` category for delay alternatives (reasonable; may add 1 `list_fx_modules` call)

### Saved slot layout (live)

**Neo Soul Live Vox 2026** (`neo-soul-live-vox-2026`) — Vocals · Neo-Soul / R&B

| Chain | Slot | Bank | Label | Effect | Module | Notes |
|-------|------|------|-------|--------|--------|-------|
| IFX | A | — | Glue | DYNAMICS | `gentle-comp` | Transparent leveling, first in chain |
| IFX | B | — | Warmth | EQ | `warm-eq` | Low-mid body, smooths harsh highs |
| IFX | C | — | Plate | REVERB | `vocal-plate` | TIME 30 override for short tail |
| TFX | A | A | Sweep | HPF | `hpf-sweep` | Filter sweep for breakdown builds |
| TFX | B | A | Throw | DELAY | `rhythmic-delay` | Tempo-synced dotted-eighth throw |

Bank B empty — agent offered optional second bank (reasonable).

### Tool call inventory (approx, live)

| Step | Tool | Expected? | Notes |
|------|------|-----------|-------|
| Meta-search ×2 | client tool search | ❌ | Start + before create |
| 1+ | `list_fx_modules` (ifx) | ✅ | Vocals / IFX |
| 2+ | `list_fx_modules` (tfx / time) | ✅ | Sweep + delay throw research |
| — | `create_rack_preset` | ✅ | Failed: duplicate id |
| — | `update_rack_preset` | ✅ | Correct Build-mode recovery |

**Not called:** `list_rack_presets`, `get_rack_preset`, `get_fx_module` ✅

**Count:** ~6–8+ (meta-search inflates; MCP calls likely 4–5)

---

## Pass / fail checklist (live)

| Criterion | Result |
|-----------|--------|
| No `list_rack_presets` | ✅ Pass |
| No `get_rack_preset` | ✅ Pass |
| No `get_fx_module` for pairings | ✅ Pass |
| Used `fxModuleId` for IFX chain | ✅ Pass |
| Module-driven TFX picks | ✅ Pass |
| Duplicate id → `update_rack_preset` | ✅ Pass (**fix from Run 3**) |
| Saved rack + slot table | ✅ Pass |
| No meta-search | ❌ Fail (×2) |
| ≤ 5 MCP tool calls | ⚠️ Borderline (~4–5 MCP + search overhead) |

**Overall:** **Partial pass** — major win on duplicate-id path; meta-search remains model/client habit, not server bug.

---

## Handler simulation (automated, pre-live)

Ran handlers after Phase 3 close-out fixes — 3 calls, `echo-fadeout` TFX pick:

1. `list_fx_modules { context: "ifx", tag: "vocals" }`
2. `list_fx_modules { context: "tfx", category: "transition" }`
3. `create_rack_preset` → `neo-soul-live-vox-2026`

Live agent overwrote this rack via `update_rack_preset` with `rhythmic-delay` instead of `echo-fadeout`.

---

## Comparison across Build-mode runs

| Issue | Run 3 | Run 4 |
|-------|-------|-------|
| Meta-search | ❌ | ❌ |
| Duplicate id → `get_rack_preset` | ❌ | ✅ `update_rack_preset` |
| No preset browse tools | ✅ | ✅ |
| Good module composition | ✅ | ✅ |

---

## Fixes applied before this run

| Fix | Where | Run 4 effect |
|-----|-------|--------------|
| Build: duplicate id → `update_rack_preset`; never `get_rack_preset` | `docs/SKILL.md`, cursor skill | ✅ Worked |
| `pairsWith` on list — skip `get_fx_module` for pairing | `docs/SKILL.md`, `tools.ts` | ✅ No redundant gets |
| `create_rack_preset` error hints `update_rack_preset` | `preset-store.ts` | Likely helped agent choose update |
| Call `create_rack_preset` directly after lists | `tools.ts` | ⚠️ Meta-search still blocked direct path |

---

## Phase 3 merge recommendation

**Merge `phase-3/skill` → `main`.** Skill + server fixes measurably improved agent behavior (duplicate-id recovery, no preset browse in Build). Remaining meta-search is outside MCP server scope — address in Phase 4 distribution (skill packaging) or accept as intermittent client/model behavior.

---

## Test Run 5 prompts (optional)

### Adapt + upload

> Load the closest bundled vocal rack to memory slot 4 — pick neo-soul or R&B if available.

### Adapt genre (default mode)

> Create an rc505 fx rack for neo-soul live vocals — something warm and performance-ready.

---

## Related

- [Test Run 3](./MCP%20Test%20Run%203%20-%20Claude%20Sonnet%204.md) — partial fail (meta-search + get fallback)
- [HANDOFF.md](./HANDOFF.md) — Phase 3 complete → Phase 4
