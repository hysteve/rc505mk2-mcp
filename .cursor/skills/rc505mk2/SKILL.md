---
name: rc505mk2
description: >-
  Use the rc505mk2 MCP server for Roland RC-505mk2 loop station workflows —
  browse FX modules and rack presets, build memory configs, generate RC0 files,
  and upload to USB. Use when the user mentions RC-505, loop station, FX racks,
  IFX/TFX, beat scatter, memory slots, or RC0 upload.
---

# RC-505mk2 MCP Workflows

Read [skills/rc505mk2/SKILL.md](../../skills/rc505mk2/SKILL.md) for full rules, data shapes, and examples.

Task shortcuts: `/rc505-upload`, `/rc505-build-rack`, `/rc505-adapt-rack`.

## Call tools directly

Never meta-search for tools. Call by name: `list_rack_presets`, `list_fx_modules`, `upload_memory`.

## Adapt vs Build

| Mode | When | First tool |
|------|------|------------|
| **Adapt** | Genre/style rack ("R&B performance", "DnB drums") | `list_rack_presets` (genre/tag/section) |
| **Build** | "from scratch", "custom", "greenfield", "don't use bundled" | `list_fx_modules` (ifx + tfx) — skip rack browse |

`list_fx_modules` returns **description**, **tags**, and **pairsWith** per module — **pairsWith is enough for chaining; skip `get_fx_module` for pairings.**

**Build mode:** after module lists → `create_rack_preset` directly (no meta-search). If id exists → `update_rack_preset` or new title — **never** `get_rack_preset` or `list_rack_presets`.

## Upload

```text
upload_memory { rack_id, slot_number }   # preferred
```

Device: USB Storage mode (MENU → USB → STORAGE → CONNECT).

## Hardware

- **BEAT_SCATTER, BEAT_REPEAT, BEAT_SHIFT, VINYL_FLICK** → TFX Slot A only, one per bank
- Preset names max 12 ASCII chars

See [skills/rc505mk2/SKILL.md](../../skills/rc505mk2/SKILL.md) for templates, category guide, and test prompts.
