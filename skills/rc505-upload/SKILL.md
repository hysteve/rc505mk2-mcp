---
name: rc505-upload
description: >-
  Upload an RC-505mk2 FX rack to a device memory slot (1–99). Use when the user
  wants to load, save, or push a rack to the loop station — merge or overwrite.
disable-model-invocation: true
---

# RC-505 Upload

Load a rack preset to a device memory slot. Call MCP tools **directly by name** — never meta-search.

Hardware rules (IFX/TFX, special Slot A, preset name limits): see umbrella skill `rc505mk2` or [docs/SKILL.md](../../docs/SKILL.md).

## Prerequisites

Device in **USB Storage mode**: MENU → USB → STORAGE → CONNECT.

Ask for **slot number (1–99)** once if the user has not provided it.

## Tool path (3–4 calls)

```
detect_device
upload_memory { rack_id, slot_number, mode?, name? }
eject_device   # upload_memory auto-ejects on success; call if manual cleanup needed
```

## Parameters

| Field | Notes |
|-------|-------|
| `rack_id` | From `list_rack_presets` or a rack you just created — **required** |
| `slot_number` | 1–99 |
| `mode` | `merge` (default) preserves tracks/rhythm; `overwrite` replaces entire slot |
| `name` | Max **12 ASCII characters** — device preset label |

## When rack_id is unknown

```
list_rack_presets { tag | genre | section }   → pick rack_id
detect_device
upload_memory { rack_id, slot_number }
```

Do **not** call `build_rack_config` before upload when you already have a `rack_id`.

## Examples

| User says | Do |
|-----------|-----|
| "Load vocal plate to slot 5" | `list_rack_presets { tag: "vocals" }` → `upload_memory { rack_id, slot_number: 5 }` |
| "Upload my custom rack to slot 3" | `upload_memory { rack_id, slot_number: 3 }` |
| "Merge new TFX into slot 2" | `upload_memory { rack_id, slot_number: 2, mode: "merge" }` |
| "Is my 505 connected?" | `detect_device` only |
