---
name: rc505-adapt-rack
description: >-
  Create or adapt an RC-505mk2 FX rack from bundled presets for a genre or style
  (R&B, DnB, vocals, drums). Use when the user describes a vibe but did not ask
  for from-scratch / greenfield.
disable-model-invocation: true
---

# RC-505 Adapt Rack (from presets)

Find the closest bundled rack for a genre/style, adapt if needed, save or upload.

Hardware rules (IFX/TFX, special Slot A, merge vs overwrite): see umbrella skill `rc505mk2` or [docs/SKILL.md](../../docs/SKILL.md).

**Default to Adapt** for vague genre prompts ("modern R&B performance", "DnB drums"). Switch to Build (`rc505-build-rack`) only when the user explicitly asks for from-scratch / greenfield.

## Tool path (3–5 calls)

```
list_rack_presets { genre | tag | section }
get_rack_preset { rack_id }              # only when adapting or inspecting
create_rack_preset OR update_rack_preset # if changes needed
upload_memory { rack_id, slot_number }   # optional — ask slot once if upload likely
```

Call `list_rack_presets` **immediately** — do not meta-search for tools.

## If no close match

Fall back to Build mode: `list_fx_modules` (ifx + tfx) → `create_rack_preset`. Do not ask clarifying questions before trying genre/tag filters.

## Examples

| User says | Do |
|-----------|-----|
| "Create an FX rack for modern R&B performance" | `list_rack_presets { genre/tag }` → adapt or upload as-is |
| "DnB drum processing rack" | `list_rack_presets { tag: "drums" }` or `{ genre: "DnB" }` |
| "Show me the stutter/glitch rack" | `list_rack_presets { tag: "glitch" }` → `get_rack_preset` |
| "Adapt vocal plate and upload to slot 5" | `list_rack_presets` → `upload_memory { rack_id, slot_number: 5 }` |

Reference rack for special TFX placement: `tfx-beat-mangle`.
