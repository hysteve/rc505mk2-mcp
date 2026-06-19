# MCP Test Run 2 - Claude Sonnet 4

> Post Phase 3.5 — skill loaded, `upload_memory` + `rack_id`, TFX validation.

---

## Prompt 1 (same as Run 1)

**User:** create an rc505 fx rack for dnb drum processing

**Result:** Skill recalled from prior session. Flow was fluid. Fewer redundant steps vs [Test Run 1](./MCP%20Test%20Run%201%20-%20Claude%20Sonnet%204.md).

---

## Prompt 2 (variant)

**User:** create an rc505 fx rack for a modern rnb performance

**Result:** Generally fluid. Skill applied correctly.

**Friction observed:**

- Opening meta-search: *"It seems the search didn't surface list_rack_presets or list_fx_modules directly"*
- Unnecessary clarifying question when prompt already implied Adapt mode (R&B + performance)

**Fixes applied (same branch):**

- SKILL: Adapt vs Build modes, "call tools directly" rule
- Tool descriptions: `list_rack_presets` / `list_fx_modules` when-to-call guidance
- `list_fx_modules` now includes `pairsWith` in summaries
- Category guide in SKILL for generic module roles

---

## Targets vs Run 1

| Metric | Run 1 (approx) | Run 2 | Target |
|--------|----------------|-------|--------|
| Tool-call overhead | High (explore + retry) | Lower | ≤ 6 for adapt+upload |
| Schema/slot errors | 1+ | 0 | 0 |
| Meta-search preamble | N/A | Seen once | 0 after skill update |

---

## Suggested Test Run 3 prompt (Build mode)

Use this to verify greenfield module composition **without** browsing bundled racks:

> **Build a custom modern R&B vocal rack from scratch using FX modules only — do not browse or adapt bundled rack presets. Compose an Input FX chain for live vocals (compression, EQ, light reverb) and a Track FX performance bank (filter sweep + delay throw) using fxModuleIds from list_fx_modules. Save the rack and show me the slot layout.**

**Expected tool path (≤ 5 calls):**

1. `list_fx_modules { context: "ifx", tag: "vocals" }` (or category filters)
2. `list_fx_modules { context: "tfx", ... }`
3. `create_rack_preset` (fxModuleIds, no `list_rack_presets`)
4. Optional: `resolve_rack` or summarize saved rack

**Failure signals:**

- Calls `list_rack_presets` first
- Meta-searches for tools instead of calling them
- Hand-types all params instead of fxModuleId
- Asks "what do you want this for?" without trying filters

---

## Suggested Test Run 3 prompt (Adapt + upload)

> **Load the closest bundled vocal rack to memory slot 4 — pick neo-soul or R&B if available.**

**Expected:** `list_rack_presets` → `upload_memory { rack_id, slot_number: 4 }` (3–4 calls if device connected).
