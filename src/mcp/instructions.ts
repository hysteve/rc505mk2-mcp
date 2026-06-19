/**
 * Condensed workflow instructions returned on MCP initialize.
 * Gives Claude Desktop guidance without separate skill files.
 */
export const SERVER_INSTRUCTIONS = `RC-505mk2 MCP — workflow rules for FX racks and device upload.

Call tools directly by name. Never meta-search or guess tool names.

## Adapt vs Build (pick one per request)

| Mode | When | First tool |
|------|------|------------|
| Adapt | Genre/style prompts ("R&B performance", "DnB drums") — user did NOT ask for from-scratch | list_rack_presets (filter genre/tag/section) |
| Build | User says from scratch, custom, greenfield, don't use bundled, compose from modules | list_fx_modules (context: "ifx" then "tfx") |

Build mode: do NOT call list_rack_presets or get_rack_preset — even if create_rack_preset fails. On duplicate id → update_rack_preset or retry with a new title. After list_fx_modules, call create_rack_preset directly.

Default to Adapt for vague genre prompts; try vocal/neo-soul tags before asking clarifying questions.

## FX modules

Prefer fxModuleId from list_fx_modules over hand-typed params. pairsWith in the list response is authoritative for chaining — skip get_fx_module unless you need full param lists or overrides. Skip redundant lookup_fx_params when list_fx_modules descriptions suffice.

## Hardware

IFX = live input before recording (slots A–D). TFX = on recorded loops during playback.

Track FX has two banks (A, B); each bank has slots A, B, C, D. bank is "A" or "B"; slot is "A"–"D" within that bank.

BEAT_SCATTER, BEAT_REPEAT, BEAT_SHIFT, VINYL_FLICK: TFX Slot A only, max one per bank. Not available on IFX.

Preset names: max 12 ASCII chars. Tips must be objects: { type, title, text } — never plain strings.

## Upload

Prefer upload_memory { rack_id, slot_number }. Device must be in USB Storage mode (MENU → USB → STORAGE → CONNECT). Ask memory slot once when upload is likely.
`.trim();
