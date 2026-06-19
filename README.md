# RC-505mk2 Assistant

**Describe the FX rack you want. Claude builds it and uploads it to your loop station.**

A free, local Claude Desktop extension for the Roland RC-505mk2. Talk in plain language — *"neo-soul vocal rack"*, *"DnB drum processing"*, *"breakdown with HPF sweep and reverse reverb"* — and get a real memory preset on your device over USB. No menu diving, no hand-editing RC0 files, no cloud account.

> **Beta** — download the `.mcpb` from [GitHub Releases](https://github.com/hysteve/rc505mk2-react/releases). Feedback via [Issues](https://github.com/hysteve/rc505mk2-react/issues).

---

## What you can do

| Task | Example prompt |
|------|----------------|
| **Load a bundled preset** | *"Load the vocal plate rack to slot 5"* |
| **Adapt for a genre or vibe** | *"Create an FX rack for neo-soul live vocals"* |
| **Build from scratch** | *"Breakdown rack: HPF sweep, reverse reverb swell, echo fadeout — no bundled presets"* |
| **Browse the library** | *"What vocal racks do you have?"* · *"Show modules for transitions"* |
| **Upload to hardware** | Connect USB Storage mode → ask to push any rack to a memory slot |

**Included:** 43 genre/style rack presets, 33 purpose-built FX modules, 21 MCP tools, server-side validation (TFX slot rules, parameter coercion). Everything runs **locally** on your machine — the MCP server does not call the cloud.

---

## Install

### Claude Desktop (recommended)

1. Download `rc505mk2-v0.2.0.mcpb` from [Releases](https://github.com/hysteve/rc505mk2-react/releases)
2. Double-click → **Install** in Claude Desktop
3. Connect RC-505mk2 via USB → **MENU → USB → STORAGE → CONNECT**
4. Try: *"List bundled rack presets"* or *"Load the vocal plate rack to slot 5"*

**Requirements:** Claude Desktop (with extensions), Roland RC-505mk2, USB cable. macOS best tested; Windows/Linux welcome — please report issues.

### From source (MCP config)

```bash
git clone https://github.com/hysteve/rc505mk2-react.git
cd rc505mk2-react
npm install && npm run build
npx rc505mk2 doctor
```

Point your MCP client at `dist/mcp/server.js`, or use `npx` after publish:

```json
{
  "mcpServers": {
    "rc505mk2": {
      "command": "npx",
      "args": ["-y", "rc505mk2-mcp"]
    }
  }
}
```

**Local dev:** `"command": "node", "args": ["<repo>/dist/mcp/server.js"]`

---

## Example session

```
You:  Is my RC-505 connected?
You:  Create an FX rack for DnB drum processing and upload to slot 3
You:  Build a custom breakdown rack from scratch — HPF sweep, reverse reverb, echo fadeout
```

More copy-paste prompts: [docs/TEST_PROMPTS.md](./docs/TEST_PROMPTS.md)

---

## Tools (21)

| Category | Tools |
|----------|-------|
| Reference | `list_fx_types`, `lookup_fx_params` |
| Browse | `list_fx_modules`, `get_fx_module`, `list_rack_presets`, `get_rack_preset`, `resolve_rack`, `list_memory_configs` |
| Build | `build_rack_config`, `generate_memory`, `parse_memory` |
| Save | `create_fx_module`, `update_fx_module`, `delete_fx_module`, `create_rack_preset`, `update_rack_preset`, `delete_rack_preset`, `save_memory_config` |
| Device | `detect_device`, `upload_memory`, `eject_device` |

Typical upload flow: `list_rack_presets` → `upload_memory` with `rack_id` + `slot_number`. User-created presets persist to `~/.rc505mk2/`.

Full reference: [docs/UNIFIED_MCP_TOOLS.md](./docs/UNIFIED_MCP_TOOLS.md)

---

## CLI

```bash
rc505mk2 generate config.json --slot 5 --output ./output
rc505mk2 detect
rc505mk2 doctor
rc505mk2 list-fx
rc505mk2 lookup-fx REVERB
```

---

## Development

```bash
npm install
npm run build
npm test              # 421 tests
```

| Doc | Description |
|-----|-------------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Technical design |
| [UNIFIED_MCP_TOOLS.md](./docs/UNIFIED_MCP_TOOLS.md) | Tool list and storage layout |
| [TEST_PROMPTS.md](./docs/TEST_PROMPTS.md) | Copy-paste test prompts by workflow |
| [LIBRARY.md](./docs/LIBRARY.md) | TypeScript library API |

Workflow rules for the MCP server live in `src/mcp/instructions.ts` (returned on initialize to Claude Desktop).

---

## License

UNLICENSED — private until published to npm.

Not affiliated with Roland or Anthropic.
