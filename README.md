# RC-505mk2 Assistant

**Describe the FX rack you want. Claude builds it and uploads it to your loop station.**

A free, local Claude Desktop extension for the [Boss RC-505mk2](https://www.boss.info/us/products/rc-505mk2/). Talk in plain language — *"neo-soul vocal rack"*, *"DnB drum processing"*, *"breakdown with HPF sweep and reverse reverb"* — and get a real memory preset on your device over USB. No menu diving, no hand-editing RC0 files, no cloud account.

> **Beta** — download the `.mcpb` from [GitHub Releases](https://github.com/hysteve/rc505mk2-mcp/releases). Feedback via [Issues](https://github.com/hysteve/rc505mk2-mcp/issues).

---

## What you can do

| Task | Example prompt |
|------|----------------|
| **Load a bundled preset** | *"Load the vocal plate rack to slot 5"* |
| **Adapt for a genre or vibe** | *"Create an FX rack for neo-soul live vocals"* |
| **Build from scratch** | *"Breakdown rack: HPF sweep, reverse reverb swell, echo fadeout — no bundled presets"* |
| **Browse the library** | *"What vocal racks do you have?"* · *"Show modules for transitions"* |
| **Read & tweak hardware** | *"What's in memory slot 3?"* · *"Pull slot 5, add slapback delay, merge back"* |
| **Share presets** | Copy files from `~/.rc505mk2/racks/` etc., or RC0 ZIP for hardware-only users |
| **Upload to hardware** | Connect USB Storage mode → ask to push any rack to a memory slot |

**Included:** 43 genre/style **rack** presets, 33 reusable **FX modules**, **26 MCP tools**, server-side validation (TFX slot rules, parameter coercion). Everything runs **locally** on your machine — the MCP server does not call the cloud.

New to the terminology? Start with **[docs/CONCEPTS.md](./docs/CONCEPTS.md)** — racks vs memory slots, IFX/TFX, JSON formats, Adapt vs Build workflows.

---

## Install

### Claude Desktop (recommended)

1. Download `rc505mk2-v{version}.mcpb` from [Releases](https://github.com/hysteve/rc505mk2-mcp/releases/latest)
2. Double-click → **Install** in Claude Desktop
3. Connect RC-505mk2 via USB → **MENU → USB → STORAGE → CONNECT**
4. Try: *"List bundled rack presets"* or *"Load the vocal plate rack to slot 5"*

**Requirements:** Claude Desktop (with extensions), [Boss RC-505mk2](https://www.boss.info/us/products/rc-505mk2/), USB cable. macOS best tested; Windows/Linux welcome — please report issues.

### From source (MCP config)

```bash
git clone https://github.com/hysteve/rc505mk2-mcp.git
cd rc505mk2-mcp
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

## Key concepts (short)

| Term | Meaning |
|------|---------|
| **FX module** | One tuned effect (`vocal-plate`, `hpf-sweep`) — building block for custom chains |
| **Rack** | A curated IFX + TFX signal chain recipe — **not** a full memory slot |
| **Memory slot** | Preset 1–99 on the device — tracks, tempo, rhythm, and all FX |
| **IFX** | Input FX — live mic/instrument before recording (slots A–D) |
| **TFX** | Track FX — on recorded loops; banks A/B, slots A–D each |
| **Adapt** | Start from closest bundled rack, tweak, upload |
| **Build** | Compose from FX modules only — skip bundled rack presets |

Full guide with JSON examples: **[docs/CONCEPTS.md](./docs/CONCEPTS.md)**

---

## Example session

```
You:  Is my RC-505 connected?
You:  Create an FX rack for DnB drum processing and upload to slot 3
You:  Build a custom breakdown rack from scratch — HPF sweep, reverse reverb, echo fadeout
You:  Read slot 3, export as share JSON, then merge a tighter delay back to the device
```

More copy-paste prompts: [docs/TEST_PROMPTS.md](./docs/TEST_PROMPTS.md)

---

## Tools (26)

| Category | Tools |
|----------|-------|
| Reference | `list_fx_types`, `lookup_fx_params` |
| Browse | `list_fx_modules`, `get_fx_module`, `list_rack_presets`, `get_rack_preset`, `resolve_rack`, `list_memory_configs`, `get_memory_config` |
| Build | `build_rack_config`, `generate_memory`, `parse_memory` |
| Save | `create_fx_module`, `update_fx_module`, `delete_fx_module`, `create_rack_preset`, `update_rack_preset`, `delete_rack_preset`, `save_memory_config` |
| Hardware share | `export_zip`, `import_zip` |
| Device | `detect_device`, `list_device_slots`, `read_device_slot`, `upload_memory`, `eject_device` |

Typical upload: `upload_memory` with `rack_id` + `slot_number`. User-created presets persist to `~/.rc505mk2/` — save tools return `file_path` for sharing.

Full reference: [docs/UNIFIED_MCP_TOOLS.md](./docs/UNIFIED_MCP_TOOLS.md) · Sharing: [docs/SHARING.md](./docs/SHARING.md)

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
npm test
npm run pack:mcpb     # → releases/rc505mk2-v{version}.mcpb (Claude Desktop bundle)
```

Contributing and releases: [CONTRIBUTING.md](./CONTRIBUTING.md)

Bundle source: `mcpb/manifest.json` + `mcpb/icon.png`. See [mcpb/README.md](./mcpb/README.md).

| Doc | Description |
|-----|-------------|
| [CONCEPTS.md](./docs/CONCEPTS.md) | Racks, modules, JSON formats, workflows (start here) |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Technical design |
| [UNIFIED_MCP_TOOLS.md](./docs/UNIFIED_MCP_TOOLS.md) | Tool list and storage layout |
| [SHARING.md](./docs/SHARING.md) | Share JSON and RC0 ZIP exchange |
| [TEST_PROMPTS.md](./docs/TEST_PROMPTS.md) | Copy-paste test prompts by workflow |
| [LIBRARY.md](./docs/LIBRARY.md) | TypeScript library API |

Workflow rules for the MCP server live in `src/mcp/instructions.ts` (returned on initialize to Claude Desktop).

---

## Hardware & official docs

| Resource | Link |
|----------|------|
| **Device** | [BOSS RC-505mkII](https://www.boss.info/us/products/rc-505mk2/) |
| **Owner's manual** | [RC-505mk2 Owner's Manual (PDF)](https://static.roland.com/assets/media/pdf/RC-505mk2_eng02_W.pdf) |
| **Parameter guide** | [RC-505mk2 Parameter Guide (PDF)](https://static.roland.com/assets/media/pdf/RC-505mk2_Parameter_eng02_W.pdf) |

FX parameter data in this repo is derived from the official parameter guide. USB storage layout follows the owner's manual (`MENU → USB → STORAGE → CONNECT`).

---

## License

MIT — see [LICENSE](./LICENSE). Free to use, modify, and share; keep the copyright notice.

Not affiliated with Boss, Roland Corporation, or Anthropic.
