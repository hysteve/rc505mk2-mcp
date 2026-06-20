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

## Distribution model

| Path | Audience | Install |
|------|----------|---------|
| **`.mcpb`** | Claude Desktop users | GitHub Release → double-click, or `npm run pack:mcpb` |
| **`npx rc505mk2-mcp`** | Developers | MCP client JSON config |
| **Local checkout** | Contributors | `npm run build` → `dist/mcp/server.js` |

The public repo ships the MCP server, preset library, and bundle metadata (`mcpb/`). Run `npm run pack:mcpb` to produce `releases/rc505mk2-v{version}.mcpb` — attach to GitHub Releases, do not commit.

---

## MCP workflow layer

| Layer | Location | Purpose |
|-------|----------|---------|
| **MCP server** | `src/mcp/server.ts` | 21 tools — USB, RC0, presets, validation |
| **MCP instructions** | `src/mcp/instructions.ts` | Adapt vs Build, TFX rules, upload path — sent on initialize |

Claude Desktop users rely on natural language + tools + initialize instructions. No slash commands in the public repo.

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
mcpb/                   # Claude Desktop bundle metadata (manifest, icon)
scripts/                # embed-template.ts, pack-mcpb.ts
skills/                 # Optional agent skills bundled into .mcpb
test/                   # Vitest
docs/                   # Public reference (TEST_PROMPTS, UNIFIED_MCP_TOOLS, LIBRARY)
```

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

One repo root package (`rc505mk2-mcp`). Prior guide site and cloud platform removed.

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
| **tsx** | Run `embed-template`, `pack-mcpb` |
| **Vitest** | Unit + integration tests |

Build: `npm run build:template` → `tsup` → `dist/mcp/server.js` (MCP bin)  
Bundle: `npm run pack:mcpb` → `releases/rc505mk2-v{version}.mcpb`

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

## `src/` audit (public release)

All modules are used by the MCP server, CLI, or library exports:

| Area | Role |
|------|------|
| `mcp/` | MCP server, tool handlers, stores, validation, instructions |
| `generator/`, `parser/`, `params/`, `config/`, `schemas/` | RC0 engine |
| `device/` | USB detect / upload / eject |
| `download/` | ZIP export helpers |
| `fx/`, `data/`, `template/` | Bundled preset data and FX reference |
| `cli/` | `rc505mk2` doctor / generate / detect |
| `stores/` | File-backed user preset persistence |
| `types/` | Shared TypeScript types |

No browser bundle; no unused legacy web-app code in `src/`.
