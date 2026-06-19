# rc505mk2-mcp

Local assistant for the Roland RC-505mk2 loop station. Browse FX modules and rack presets, build memory configs, and upload directly to your device via USB — from Claude, in plain language. No cloud, no API keys.

## Install (recommended for most users)

1. Download `rc505mk2-v0.2.0.mcpb` from [Releases](https://github.com/hysteve/rc505mk2-react/releases) (or build locally: `npm run pack:plugin`)
2. Double-click the file
3. Click **Install** in Claude Desktop
4. Connect your RC-505mk2 via USB in **Storage mode** (MENU → USB → STORAGE → CONNECT)
5. Try: *"Load the vocal plate rack to slot 5"*

No terminal or JSON editing required. The bundle includes the MCP server, preset library, and agent workflow skills.

## Install (developers)

Two commands — MCP server + agent skills:

```bash
# MCP tools (USB, presets, RC0 generation)
claude mcp add rc505mk2 -- npx -y rc505mk2-mcp

# Workflow skills (umbrella + task shortcuts)
npx skills add hysteve/rc505mk2-react \
  --skill rc505mk2 \
  --skill rc505-upload \
  --skill rc505-build-rack \
  --skill rc505-adapt-rack \
  -g -y
```

From a local checkout:

```bash
npm install && npm run build && npm run sync:skills
npx skills add ./ \
  --skill rc505mk2 \
  --skill rc505-upload \
  --skill rc505-build-rack \
  --skill rc505-adapt-rack \
  -a cursor -a claude-code
```

Verify: `npx rc505mk2 doctor`

### Slash skills

| Command | Purpose |
|---------|---------|
| `/rc505mk2` | Umbrella — any RC-505 task |
| `/rc505-upload` | Device slot upload (merge/overwrite) |
| `/rc505-build-rack` | Greenfield rack from FX modules |
| `/rc505-adapt-rack` | Genre rack from bundled presets |

See [docs/SKILL.md](./docs/SKILL.md) for the full workflow reference.

### Other MCP clients (Cursor, VS Code, Claude Desktop JSON)

Add this to your MCP client config:

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

Connect your RC-505mk2 via USB in **Storage mode** (MENU → USB → STORAGE → CONNECT) before using device tools.

## MCP client setup

### Cursor / VS Code

`.vscode/mcp.json` in your project (or user MCP settings):

```json
{
  "servers": {
    "rc505mk2": {
      "command": "npx",
      "args": ["-y", "rc505mk2-mcp"]
    }
  }
}
```

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS:

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

Restart Claude Desktop after saving.

### Claude Code (CLI)

```bash
claude mcp add rc505mk2 -- npx -y rc505mk2-mcp
```

### Local development (from this repo)

```bash
npm install
npm run build
npm run sync:skills   # docs/SKILL.md → skills/rc505mk2/
```

```json
{
  "mcpServers": {
    "rc505mk2": {
      "command": "node",
      "args": ["<path-to-repo>/dist/mcp/server.js"]
    }
  }
}
```

### Build consumer plugin (.mcpb)

```bash
npm run pack:plugin
# → releases/rc505mk2-v0.2.0.mcpb
# → releases/rc505mk2-skills-v0.2.0.zip
```

## Verify your install

```bash
npx rc505mk2-mcp --help 2>/dev/null || npx rc505mk2 doctor
```

Or after installing globally / from source:

```bash
rc505mk2 doctor
```

Doctor checks Node version, MCP SDK, bundled preset data paths, user store writability, and device connectivity.

## Tools (21)

| Category | Tools |
|----------|-------|
| Reference | `list_fx_types`, `lookup_fx_params` |
| Browse | `list_fx_modules`, `get_fx_module`, `list_rack_presets`, `get_rack_preset`, `resolve_rack`, `list_memory_configs` |
| Build | `build_rack_config`, `generate_memory`, `parse_memory` |
| Save | `create_fx_module`, `update_fx_module`, `delete_fx_module`, `create_rack_preset`, `update_rack_preset`, `delete_rack_preset`, `save_memory_config` |
| Device | `detect_device`, `upload_memory`, `eject_device` |

Example workflow in one MCP session:

1. `list_rack_presets` → pick a rack
2. `upload_memory` → `{ rack_id, slot_number }`
3. `detect_device` → confirm USB connection (optional if upload fails with not detected)
4. `eject_device` → safe unmount (upload_memory auto-ejects on success)

User-created presets persist to `~/.rc505mk2/` (override with `RC505MK2_DATA_DIR`).

## CLI

```bash
rc505mk2 generate config.json --slot 5 --output ./output
rc505mk2 detect
rc505mk2 doctor
rc505mk2 list-fx
rc505mk2 lookup-fx REVERB
```

## Development

```bash
npm install
npm run build
npm run sync:skills
npm test
```

| Doc | Description |
|-----|-------------|
| [DISTRIBUTION.md](./docs/DISTRIBUTION.md) | **Install strategy** — MCPB, Agent Skills, marketplace |
| [SKILL.md](./docs/SKILL.md) | Agent workflow reference (source of truth) |
| [TEST_PROMPTS.md](./docs/TEST_PROMPTS.md) | **Copy-paste test prompts** by category |
| [INSPIRE.md](./docs/INSPIRE.md) | **Inspire Me** feature spec (Phase 6) |
| [HANDOFF.md](./docs/HANDOFF.md) | Session handoff — Phase 4 status |
| [PROJECT_PLAN_V2.md](./docs/PROJECT_PLAN_V2.md) | Phased roadmap |
| [UNIFIED_MCP_TOOLS.md](./docs/UNIFIED_MCP_TOOLS.md) | Tool list & storage layout |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Technical decisions |
| [LIBRARY.md](./docs/LIBRARY.md) | Library API reference |

## License

UNLICENSED — private until published to npm.
