# Architecture — RC-505mk2 MCP Server

> Local-first MCP server for the Roland RC-505mk2 — preset library, RC0 generation, USB upload.

---

## System overview

```
┌─────────────────────────────────────────────────────────┐
│  Claude Desktop / Cursor / Claude Code                  │
│  (MCP client)                                           │
└────────────────────────┬────────────────────────────────┘
                         │ stdio JSON-RPC
┌────────────────────────▼────────────────────────────────┐
│  rc505mk2-mcp  (src/mcp/server.ts)                      │
│  ├── instructions       (initialize — workflow rules)   │
│  ├── Reference handlers   (FX types, params)            │
│  ├── Preset handlers      (browse, CRUD, generate)      │
│  └── Device handlers      (detect, upload, eject)       │
└──────┬──────────────────────────────┬───────────────────┘
       │                              │
       ▼                              ▼
┌──────────────┐              ┌────────────────┐
│ PresetStore  │              │ Device I/O     │
│ bundled data │              │ (Node.js fs,   │
│ ~/.rc505mk2  │              │  diskutil)     │
└──────┬───────┘              └────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Core engine (src/)                  │
│  generator · parser · params · config│
└──────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  RC0 XML  →  RC-505mk2 SD card       │
│  ROLAND/DATA/MEMORY/MEMORYnnnA.RC0   │
└──────────────────────────────────────┘
```

---

## Product evolution

| Era | Direction | Status |
|-----|-----------|--------|
| Guide site | rc505guide.com — browse racks, dial in manually | Superseded; vision in [archive/VISION.md](./archive/VISION.md) |
| Cloud platform | Postgres + HTTP MCP + accounts | Dropped — see [archive/CONFIG-SYSTEM-PLAN.md](./archive/CONFIG-SYSTEM-PLAN.md) |
| **MCP server (now)** | Local tools + `.mcpb` for Claude Desktop | **Beta** |

The bundled preset library (`data/fx-modules/`, `src/data/racks.json`) inherits accuracy goals from the guide project: human-readable params validated against `fx-reference.json`, server-side TFX slot rules at create time.

---

## Distribution model

**Primary (consumer):** `.mcpb` Claude Desktop extension — double-click install, manifest starter prompts, MCP server bundled.

**Secondary (developer):** `npx rc505mk2-mcp` + optional MCP JSON config. No npm publish required for beta; GitHub Release attaches the built `.mcpb`.

**Not shipping for beta:**

| Item | Status |
|------|--------|
| Claude marketplace listing | After beta feedback — maybe never |
| Claude Code plugin zip | Dropped — use `npx skills add` if needed |
| Agent slash skills | Under development — not release focus |
| npm publish | Post-beta optional |

Build: `npm run pack:plugin` → `releases/rc505mk2-v0.2.0.mcpb`

---

## Plugin vs Skill vs MCP server

Three layers, different hosts:

| Layer | Location | Runs code? | Claude Desktop | Cursor / Claude Code |
|-------|----------|------------|----------------|----------------------|
| **MCP server** | `src/mcp/server.ts` | Yes | via `.mcpb` | via MCP config |
| **MCP instructions** | `src/mcp/instructions.ts` | No | ✅ on initialize | ✅ on initialize |
| **Manifest prompts** | `plugin/manifest.json` | No | ✅ Desktop UI | N/A |
| **Agent skills** | `skills/rc505*/` | No | ❌ not slash cmds | Optional, WIP |

**Desktop workflow:** natural language + MCP tools + server `instructions` + extension starter prompts. Slash commands (`/rc505-upload`) are Code/Cursor only and not polished for beta.

---

## Source layout

```
src/
├── generator/          # RC0 XML generation
├── parser/             # RC0 → MemoryConfig
├── params/             # RCO mapping — param-map, transforms, effect-map
├── config/             # Inheritance resolve + merge
├── schemas/            # Zod validation
├── fx/                 # FX name lists, IFX/TFX indexes
├── device/             # USB detect, upload, eject (Node-only)
├── download/           # ZIP export (isomorphic via fflate)
├── template/           # Embedded default.rc0
├── data/               # load-racks.ts, racks.json, fx-reference.json
├── mcp/                # server, tools, handlers, instructions, validation
├── cli/                # rc505mk2 CLI
├── types/
├── index.ts            # Public library API (isomorphic)
└── node.ts             # Node-only exports (device, file stores)

data/fx-modules/        # Bundled FX module JSON
plugin/manifest.json    # MCPB manifest
scripts/                # embed-template, pack-plugin, sync-skills, create-icon
test/                   # Vitest
docs/manual-test/       # Manual Claude test run notes
```

**Removed / not used:** `src/browser.ts` (dropped — MCP/CLI-only package; ZIP helpers live on main `index` export).

---

## Core data model

```
FxModule  →  Rack  →  MemoryConfig  →  RC0 XML (A + B pair)
(reusable)   (preset)  (device slot)    (on SD card)
```

Canonical values are **human-readable display strings** (`"HALL1"`, `"-6"`, `"1/8"`). Numeric RC0 values computed at generation via `params/transforms.ts`.

Inheritance: slots reference `fxModuleId`; racks may override module params. Resolved in `config/resolve.ts` before `memoryConfigToRc0Pair()`.

---

## Key technical decisions

### 1. Local-first, no cloud

User presets persist to `~/.rc505mk2/` as JSON. No accounts, no backend, offline-capable after install.

### 2. Single npm package

One repo root package (`rc505mk2-mcp`). Guide React app and `packages/web` cloud stack removed (Phase 0).

### 3. Agent UX hardening (server-side)

- TFX slot validation at `create_rack_preset` / `update_rack_preset`
- `normalize-rack-input.ts` — `fxModuleId` coercion, tip object shape
- `upload_memory({ rack_id, slot_number })` — skip redundant build step
- MCP `instructions` on initialize — Adapt vs Build, bank/slot rules

### 4. macOS-first device I/O

Primary test platform: macOS (`diskutil` eject, `/Volumes/` scan). Linux/Windows best-effort.

### 5. Build toolchain

| Tool | Purpose |
|------|---------|
| **tsup** | Bundle `index`, `node`; ESM bins for CLI + MCP |
| **tsx** | `embed-template`, `pack-plugin`, `sync-skills` |
| **Vitest** | Unit + integration tests |

Build: `npm run build:template` → `tsup` → `dist/mcp/server.js` (MCP bin)

### 6. Dependencies (runtime)

`zod`, `fflate`, `@modelcontextprotocol/sdk` — nothing else.

### 7. Embedded default template

`scripts/embed-template.ts` embeds `test/fixtures/default.rc0` → `src/template/default-template.ts` at build time.

### 8. Security model

- MCP runs with user permissions locally
- `upload_memory` writes USB mass storage — supports merge vs overwrite
- No network in MCP server (except user's Claude client)

---

## Module boundaries

```
rc505mk2-mcp
├── "."        → index.ts   (isomorphic library API)
└── "./node"   → node.ts     (device + file stores)

Bins:
├── rc505mk2-mcp  → dist/mcp/server.js
└── rc505mk2      → dist/cli/generate-memories.js
```

---

## Migration notes (from v1 monorepo)

| Old | New |
|-----|-----|
| `packages/rc505mk2-lib/src/` | `src/` |
| Root guide React app | Removed — see `docs/archive/` |
| `packages/web/` cloud MCP | Removed — see `docs/archive/CONFIG-SYSTEM-PLAN.md` |

Manual test history: [manual-test/](./manual-test/)
