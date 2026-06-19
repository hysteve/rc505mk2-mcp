# MCP Test 5 - Claude Sonnet 4 (Plugin)

> **Prompt:** Create a breakdown rack: HPF sweep + reverse reverb swell + echo fadeout. No bundled presets.  
> **Client:** Claude Desktop via `.mcpb` plugin (Phase 4)  
> **Verdict:** **Partial pass** — rack saved correctly after retries; friction on slot/bank + fxModuleId schema.

---

## Prompt

> Create a breakdown rack: HPF sweep + reverse reverb swell + echo fadeout. No bundled presets.

---

## What went well

- **Build mode** — went to `list_fx_modules`, not bundled racks ✅
- **Module picks** — `hpf-sweep`, `reverse-reverb-swell`, `echo-fadeout` via `pairsWith` ✅
- **Final layout** — three modules in **bank A, slots A/B/C** (correct) ✅
- **`build_rack_config`** resolved cleanly ✅

---

## Friction (goofy parts)

### 1. Meta-search at start

> *"I'll search for tools related to building an RC-505mk2 rack configuration."*

Same class as Test Runs 2–4 — client/model habit, not server bug.

### 2. Slot/bank structure confusion

First `create_rack_preset` failed. Agent recovered with:

> *"I had the slot/bank structure backwards — slot takes the letter (A-D) and bank is separate."*

**Root cause:** Tool copy said "TFX slots need slot + bank" but did not spell out that there are only **two banks** (A/B), each with **four slots** (A–D). Agent briefly thought "three modules = three banks."

**Also said (incorrect terminology):**

> *"assign them across the three TFX banks"*

There is no bank C.

### 3. Unnecessary `lookup_fx_params`

After slot fix, agent called `lookup_fx_params` because it believed:

> *"the schema still wants effect and params fields present even when overriding via module ID"*

**Root cause:** `create_rack_preset` schema required `effect` + `params` even when `fxModuleId` was set. Agent did not know `list_fx_modules` already returns `effect`, or that `params: []` inherits from the module.

### 4. Param type / sequencer schema retry

> *"Param values need to be strings, and the sequencer needs to be an array, not an object."*

**Root cause:** Agent sent numeric override values (e.g. `TIME: 30`) and/or `sequencer: {}` when no sequencer was needed. Zod rejected before save.

**Fix (post Test 5b):** Server coerces numeric param values to strings; drops invalid `sequencer` (empty object); omit sequencer when unused.

---

## Fixes applied (post Test 5)

| Fix | Where |
|-----|-------|
| **fxModuleId inference** — omit `effect`; server fills from module; `params` defaults to `[]` | `normalize-rack-input.ts`, handlers |
| **TFX bank validation** — reject bank C/D with example of three slots in bank A | `validate-rack.ts` |
| **Clear tool description** — bank vs slot, fxModuleId minimal shape, skip `lookup_fx_params` | `tools.ts` |
| **Param coercion** — numeric values → strings; drop `sequencer: {}` | `normalize-rack-input.ts` |
| **SKILL.md** — bank/slot table + fxModuleId example | `docs/SKILL.md` |
| **Tests** — breakdown rack fxModuleId-only create; bank C rejection | `mcp-preset-handlers.test.ts`, `validate-rack.test.ts` |

**Expected path after fixes (≤ 5 MCP calls):**

1. `list_fx_modules { context: "tfx", ... }` (1–2 calls)
2. `create_rack_preset` with `{ slot, bank: "A", fxModuleId, params: [] }` × 3 — **first try succeeds**
3. Optional: `build_rack_config` or offer upload

**Not expected:** `lookup_fx_params`, `get_fx_module`, retry loop on create.

---

## Saved result

**Breakdown Swell** (`breakdown-swell`)

| Bank | Slot | Module | Role |
|------|------|--------|------|
| A | A | hpf-sweep | Filter sweep build |
| A | B | reverse-reverb-swell | Reverse swell |
| A | C | echo-fadeout | Echo fadeout tail |

---

## Retest prompt

> Create a breakdown rack: HPF sweep + reverse reverb swell + echo fadeout. No bundled presets.

Pass if: single successful `create_rack_preset`, no `lookup_fx_params`, no slot/bank retry.

---

## Related

- [Test Run 4](./MCP%20Test%20Run%204%20-%20Claude%20Sonnet%204.md) — Build mode duplicate-id fix
- [SKILL.md](./SKILL.md) — Track FX bank vs slot
- [TEST_PROMPTS.md](./TEST_PROMPTS.md) — Build mode prompts
