# MCP Test Run 3 - Claude Sonnet 4

> **Mode:** Build (greenfield — modules only, no bundled rack browse)  
> **Skill:** Loaded (post Adapt/Build + `pairsWith` updates)  
> **Verdict:** Partial pass — correct module picks and final rack shape, but **failed Build constraints** (meta-search, preset lookup fallback).

---

## Prompt

> Build a custom modern R&B vocal rack from scratch using FX modules only — do not browse or adapt bundled rack presets. Compose an Input FX chain for live vocals (compression, EQ, light reverb) and a Track FX performance bank (filter sweep + delay throw) using fxModuleIds from list_fx_modules. Save the rack and show me the slot layout.

---

## What happened (cleaned)

### 1. Correct start (Build mode)

Agent stated intent to use Build workflow — no preset browsing. Called `list_fx_modules` for Input FX.

**IFX modules chosen:**

| Slot | Module ID | Role |
|------|-----------|------|
| A | `gentle-comp` | Dynamics / glue |
| B | `warm-eq` | Tone / body |
| C | `vocal-plate` | Light plate reverb |

### 2. TFX modules

Second `list_fx_modules` call (TFX context). Selected:

| Slot | Bank | Module ID | Role |
|------|------|-----------|------|
| A | A | `hpf-sweep` | Filter sweep build |
| B | A | `echo-fadeout` | Delay throw / fadeout |

Noted `hpf-sweep` → `echo-fadeout` pairing (already visible via `pairsWith` on list response).

### 3. Friction — meta-search before create

Before saving, agent reported:

> *"The search surfaced a different tool set (no create_rack_preset directly)… Let me search more specifically."*

Then meta-searched tools again instead of calling `create_rack_preset` immediately.

**Failure:** Same client/model habit as [Test Run 2](./MCP%20Test%20Run%202%20-%20Claude%20Sonnet%204.md) — not an MCP server issue.

### 4. Extra `get_fx_module` calls

Agent called `get_fx_module` to confirm `pairsWith` on `hpf-sweep` / `echo-fadeout` even though `list_fx_modules` already returns `pairsWith`.

**Waste:** 1–2 avoidable tool calls.

### 5. Create failed → fell back to preset lookup (Build violation)

`create_rack_preset` failed — rack **`modern-r-b-vocal`** already existed in user store from a prior session.

Instead of `update_rack_preset` or a new title, agent:

1. Called **`get_rack_preset`** — *"pull it up rather than overwrite blindly"*
2. Called **`resolve_rack`** to show expanded params

**Failure:** Build prompt said *do not browse presets*; `get_rack_preset` is preset lookup. Acceptable recovery for a human, wrong for validating Build workflow.

### 6. Final output

Slot layout matched the intended design. Rack id: `modern-r-b-vocal`. Bank B empty — agent offered optional second bank (reasonable).

---

## Tool call inventory (approx)

| Step | Tool | Expected in Build? | Notes |
|------|------|----------------------|-------|
| 1 | `list_fx_modules` (ifx) | ✅ | Correct |
| 2 | `list_fx_modules` (tfx) | ✅ | Correct |
| 3 | `get_fx_module` ×2 | ⚠️ Optional | `pairsWith` already on list |
| 4 | Meta-search tools | ❌ | Should not happen |
| 5 | `create_rack_preset` | ✅ | Failed: duplicate id |
| 6 | `get_rack_preset` | ❌ | Build mode violation |
| 7 | `resolve_rack` | ⚠️ Optional | OK if create succeeded |

**Count:** ~7+ calls (target ≤ 5). **`list_rack_presets` not called** ✅

---

## Pass / fail checklist

| Criterion | Result |
|-----------|--------|
| No `list_rack_presets` | ✅ Pass |
| Used `fxModuleId` for IFX chain | ✅ Pass |
| Used module-driven TFX picks | ✅ Pass |
| No meta-search for tools | ❌ Fail |
| Saved via `create_rack_preset` without lookup fallback | ❌ Fail (duplicate id → `get_rack_preset`) |
| Slot layout / hardware rules | ✅ Pass |
| ≤ 5 tool calls | ❌ Fail (~7+) |

**Overall:** **Partial fail** as a Build-mode regression test; **pass** on musical/technical rack composition.

---

## Root causes

1. **Meta-search** — Model/client behavior; skill says "call directly" but still occurs intermittently.
2. **Duplicate rack id** — User store already had `modern-r-b-vocal`; no upsert path; agent chose lookup over update.
3. **Redundant `get_fx_module`** — Skill doesn't yet say "pairsWith on list is enough."

---

## Recommended fixes (before Test Run 4)

| Fix | Where | Effort |
|-----|-------|--------|
| Build mode: on duplicate id → `update_rack_preset` or new title; **never** `get_rack_preset` | `docs/SKILL.md` | Doc |
| "pairsWith on `list_fx_modules` is authoritative — skip `get_fx_module` for pairing" | `docs/SKILL.md` + tool description | Doc |
| Delete test rack before rerun: `~/.rc505mk2/racks/modern-r-b-vocal.json` | Manual / Test Run 4 prep | — |
| Optional: `create_rack_preset` error hint — *"Rack exists; use update_rack_preset or choose a new title"* | Server | Small code |
| Optional: `upsert: true` on create | Server | Phase 4+ if needed |

---

## Suggested Test Run 4 prompt

Use a **unique title** to avoid duplicate-id path:

> **Build a custom neo-soul vocal rack from scratch (title: "Neo Soul Live Vox 2026") — FX modules only, no bundled rack presets. IFX: compression + EQ + short reverb via fxModuleIds. TFX Bank A: filter sweep + delay throw. Save and print the slot table. Do not call get_rack_preset or list_rack_presets.**

**Success:** 3–4 calls, no meta-search, no preset browse tools.

---

## Related

- [Test Run 1](./MCP%20Test%20Run%201%20-%20Claude%20Sonnet%204.md) — baseline
- [Test Run 2](./MCP%20Test%20Run%202%20-%20Claude%20Sonnet%204.md) — Adapt mode + meta-search
- [manual-test/README.md](./README.md) — test run index
