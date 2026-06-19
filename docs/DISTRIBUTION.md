# Distribution Strategy — RC-505mk2

> **Two audiences, two install paths** — same engine, different packaging.
> **Consumers:** one-click plugin. **Developers:** `npx` for MCP + skill.

---

## Overview

| Audience | MCP (tools) | Skill (workflow) | Install |
|----------|-------------|------------------|---------|
| **Consumer** | `.mcpb` bundle | Embedded in plugin (manifest prompts + skill ZIP) | Download → double-click → Install |
| **Developer** | `npx rc505mk2-mcp` | `npx skills add <repo> --skill rc505mk2` | Two commands, no JSON editing |

Both paths ship the same preset data and MCP server code. The npm package is the build artifact that gets bundled into `.mcpb`.

---

## The problem with manual JSON config

Phase 2 shipped `npx rc505mk2-mcp` + copy-paste MCP JSON. That works for developers who already use Cursor or Claude Code, but fails for:

1. Non-technical RC-505 owners
2. Devs who want skill + MCP without hand-editing config files

**Tools without workflow guidance fail.** **Config files without one-click install fail.** We need both, packaged appropriately per audience.

---

## Consumer path (primary)

### Tier 1 — MCPB (`.mcpb`)

[MCP Bundles](https://github.com/modelcontextprotocol/mcpb) — one-click local MCP install for Claude Desktop.

```
rc505mk2.mcpb
├── manifest.json      ← metadata, icon, starter prompts
├── dist/              ← MCP server + preset data
├── skills/rc505mk2/   ← Agent Skill (optional in bundle)
└── icon.png
```

**User flow:** Download → double-click → **Install** in Claude Desktop. No terminal, no Node install (Claude bundles runtime).

**Build:** `@anthropic-ai/mcpb` CLI (`mcpb init`, `mcpb pack`, `mcpb validate`).

### Tier 2 — Claude marketplace plugin

Claude plugin bundling skill + `.mcp.json` for `/plugin install` or Extensions directory browse.

### Tier 3 — Hosted download

GitHub Releases or simple landing page until marketplace acceptance.

---

## Developer path (secondary, first-class)

Target: a developer runs **two commands** and has MCP + skill wired for their agent.

### MCP server — `npx rc505mk2-mcp`

Published npm package with executable bin wrappers (already in `package.json`):

| Bin | Purpose |
|-----|---------|
| `rc505mk2-mcp` | stdio MCP server (primary) |
| `rc505mk2` | CLI utilities (`doctor`, `generate`, `detect`, …) |

```bash
# MCP client config (Claude Code example)
claude mcp add rc505mk2 -- npx -y rc505mk2-mcp
```

No global install required. `npx` fetches the package on first run.

**Future polish:** `npx rc505mk2-mcp init` — detect client, write MCP config automatically (Phase 4 dev track).

### Agent skill — `npx skills add`

[Vercel Skills CLI](https://github.com/vercel-labs/skills) — cross-agent skill install (Claude Code, Cursor, Copilot, 38+ agents).

Repo layout for compatibility:

```
skills/
├── rc505mk2/           # Umbrella → /rc505mk2
├── rc505-upload/       # Task → /rc505-upload
├── rc505-build-rack/   # Task → /rc505-build-rack
└── rc505-adapt-rack/   # Task → /rc505-adapt-rack
```

Each task skill is a trimmed workflow; hardware rules live in the umbrella skill. See [Slash skills plan](./PROJECT_PLAN_V2.md#slash-skills-plan) in PROJECT_PLAN_V2.md.

```bash
# After repo is public / skills path exists
npx skills add hysteve/rc505mk2-react --skill rc505mk2 --skill rc505-upload --skill rc505-build-rack --skill rc505-adapt-rack -g -y

# Or from local checkout during dev
npx skills add ./ --skill rc505mk2 -a claude-code -a cursor
```

The CLI symlinks/copies into each agent's skill directory (`.claude/skills/`, `.cursor/skills/`, etc.).

**Source of truth:** `docs/SKILL.md` → build step syncs to `skills/rc505mk2/SKILL.md`.

### Dev quick-start (target copy)

```bash
# 1. MCP server
claude mcp add rc505mk2 -- npx -y rc505mk2-mcp

# 2. Agent skill
npx skills add hysteve/rc505mk2-react --skill rc505mk2 -g -y

# 3. Verify
npx rc505mk2 doctor
```

---

## Bundling skill + MCP (consumer plugin)

Three layers inside `.mcpb`:

### Layer 1 — Manifest prompts

Starter prompts in `manifest.json` for Claude Desktop UI:

```json
{
  "prompts": [
    {
      "name": "load-rack-to-slot",
      "description": "Load a bundled FX rack to a memory slot",
      "text": "Load an RC-505mk2 FX rack to memory slot ${arguments.slot}. Use upload_memory with rack_id when possible."
    }
  ]
}
```

### Layer 2 — Agent Skill directory

Portable [Agent Skills spec](https://agentskills.io/specification) content — same files as `skills/rc505mk2/` used by `npx skills add`.

### Layer 3 — Claude plugin wrapper (Phase 5)

```
plugin/
├── .claude-plugin/plugin.json
├── .mcp.json
└── skills/rc505mk2/SKILL.md
```

---

## Target repo layout

```
rc505mk2/
├── src/                          # engine + MCP server
├── data/                         # bundled presets
├── skills/rc505mk2/              # Agent Skill (dev: npx skills add)
│   ├── SKILL.md
│   └── references/
├── docs/SKILL.md                 # full reference (source of truth)
├── plugin/
│   ├── manifest.json             # MCPB manifest
│   ├── assets/                   # icon, screenshots
│   └── pack.sh                   # mcpb pack + skill ZIP
├── releases/
│   ├── rc505mk2-vX.Y.Z.mcpb      # consumer install
│   └── rc505mk2-skill-vX.Y.Z.zip # Claude.ai upload
└── package.json                  # npm publish (dev: npx rc505mk2-mcp)
```

---

## User-facing install copy

### Consumer (Claude Desktop)

1. Download **RC-505mk2 Assistant** (`rc505mk2.mcpb`)
2. Double-click → **Install**
3. Connect RC-505 in USB Storage mode
4. *"Load the vocal plate rack to slot 5"*

### Developer

```bash
claude mcp add rc505mk2 -- npx -y rc505mk2-mcp
npx skills add hysteve/rc505mk2-react --skill rc505mk2 -g -y
```

See README for Cursor, VS Code, and local dev paths.

---

## Marketplace path (Phase 5)

Claude Desktop **Extensions directory** — browse, search, one-click install.

Deliverables: validated `.mcpb`, icon, screenshots, privacy review (local-only, no network), support URL.

Until accepted: GitHub Releases + optional skills.sh listing.

---

## Agent UX improvements (Phase 3.5 — before distribution)

These ship on `phase-3/skill` **before** Phase 4 packaging:

| Improvement | Why |
|-------------|-----|
| **Server-side TFX slot validation** | Reject BEAT_SCATTER etc. in wrong slots at `create_rack_preset` |
| **`upload_memory` accepts `rack_id`** | Skip `build_rack_config` for "upload this rack to slot N" |
| **MCP Test Run 2** | Re-run DnB prompt; compare tool-call count vs [Test Run 1](./MCP%20Test%20Run%201%20-%20Claude%20Sonnet%204.md) |

See Phase 3.5 in [PROJECT_PLAN_V2.md](./PROJECT_PLAN_V2.md).

---

## Success metrics

| Metric | Target |
|--------|--------|
| Consumer install steps | ≤ 3 (download, double-click, Install) |
| Dev install commands | 2 (`mcp add` + `skills add`) |
| Tool calls: "load rack to slot N" | ≤ 4 with `upload_memory` + `rack_id` |
| Tool calls: "create DnB rack + upload" | ≤ 6 (MCP Test Run 2) |
| Schema/slot errors without LLM catch | 0 (server validation) |

---

## Deprioritized

| Item | Status |
|------|--------|
| Copy-paste MCP JSON as primary onboarding | Dev fallback only |
| `.cursor/skills/` as separate deliverable | Covered by `npx skills add` |
| Cursor-specific plugin | Out of scope unless demand |

---

## References

- [MCPB spec & CLI](https://github.com/modelcontextprotocol/mcpb)
- [Vercel Skills CLI](https://github.com/vercel-labs/skills)
- [Agent Skills specification](https://agentskills.io/specification)
- [Claude Desktop Extensions](https://www.anthropic.com/engineering/desktop-extensions)
