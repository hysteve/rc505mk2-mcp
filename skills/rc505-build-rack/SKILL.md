---
name: rc505-build-rack
description: >-
  Build a greenfield RC-505mk2 FX rack from FX modules only — no bundled preset
  browse. Use when the user says from scratch, custom, greenfield, or compose
  from modules.
disable-model-invocation: true
---

# RC-505 Build Rack (greenfield)

Compose a new rack from FX modules. **Do not** browse bundled presets in this mode.

Hardware rules (IFX vs TFX, BEAT_* in TFX Slot A only, tips schema): see umbrella skill `rc505mk2` or [docs/SKILL.md](../../docs/SKILL.md).

## Build mode constraints (never violate)

- Do **not** call `list_rack_presets` or `get_rack_preset`
- After `list_fx_modules`, call `create_rack_preset` **directly** — no meta-search
- If create fails (duplicate id) → `update_rack_preset` or new title — **never** browse presets
- `list_fx_modules` returns `pairsWith` — skip `get_fx_module` unless you need full param lists

## Tool path (3–4 calls)

```
list_fx_modules { context: "ifx", tag?: "..." }
list_fx_modules { context: "tfx", tag?: "..." }
create_rack_preset   # fxModuleId per slot; use pairsWith for chain ideas
upload_memory { rack_id, slot_number }   # optional — ask slot once if user wants upload
```

## Rack template essentials

Required: `title`, `genres`, `inputFx`, `trackFx`. Tips must be `{ type, title, text }` objects — never plain strings.

TFX slots need `slot` + `bank` (`"A"` or `"B"` only). **Slot** = position A–D within a bank; **bank** = which of the two TFX banks. Three modules in one bank: same `bank`, different `slot` letters.

**fxModuleId create:** `{ slot, bank?, fxModuleId, params: [] }` — effect filled server-side; omit `sequencer` (never `{}`); numeric overrides OK. Special FX (BEAT_SCATTER, BEAT_REPEAT, BEAT_SHIFT, VINYL_FLICK) → TFX **Slot A only**, max one per bank.

Full template and checklist: [docs/SKILL.md](../../docs/SKILL.md#rack-preset-template).

## Examples

| User says | Do |
|-----------|-----|
| "Build a custom R&B vocal rack from scratch" | `list_fx_modules` ifx+tfx → `create_rack_preset` with fxModuleIds |
| "Design a performance rack — pick modules by purpose" | `list_fx_modules` → compose → `create_rack_preset` |
| "Greenfield IFX chain: gentle-comp, warm-eq, vocal-plate" | Verify IDs via `list_fx_modules` → `create_rack_preset` |
