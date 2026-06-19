# Architecture — RC-505mk2 MCP Server (v2)

> Next-gen technical design for a single-package, local-first MCP server.

---

## System overview

```
┌─────────────────────────────────────────────────────────┐
│  Claude / Cursor / Claude Code                          │
│  (MCP client)                                           │
└────────────────────────┬────────────────────────────────┘
                         │ stdio JSON-RPC
┌────────────────────────▼────────────────────────────────┐
│  rc505mk2-mcp  (src/mcp/server.ts)                      │
│  ├── Reference handlers    (FX types, params)           │
│  ├── Preset handlers       (browse, CRUD, generate)    │
│  └── Device handlers       (detect, upload, eject)      │
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

## Package structure

```
src/
├── generator/          # RC0 XML generation (rc0-generator.ts, xml-ops.ts)
├── parser/             # RC0 → MemoryConfig (rc0-parser.ts, hex-count.ts)
├── params/             # RCO mapping — param-map, transforms, effect-map
├── config/             # Inheritance resolve + merge
├── schemas/            # Zod schemas (runtime validation)
├── fx/                 # FX name lists, IFX/TFX indexes
├── device/             # USB detect, upload, eject (Node-only)
├── download/           # ZIP export, readme generation
├── template/           # Embedded default.rc0 template
├── data/               # load-racks.ts, racks.json, fx-reference.json
├── mcp/                # MCP server, tools, handlers, stores
├── cli/                # rc505mk2 CLI (generate-memories)
├── types/              # Shared TypeScript types
├── index.ts            # Public API barrel
├── browser.ts          # Browser-safe subset (no node:fs)
└── node.ts             # Node-only exports (device, stores)

data/
└── fx-modules/         # Bundled FX module JSON files

test/                   # Vitest — keep coverage on generator, parser, MCP handlers
scripts/
└── embed-template.ts   # Embeds default.rc0 → src/template/default-template.ts
```

---

## Core data model

```
FxModule  →  Rack  →  MemoryConfig  →  RC0 XML (A + B pair)
(reusable)   (preset)  (device slot)    (on SD card)
```

All canonical values are **human-readable display strings** (`"HALL1"`, `"-6"`, `"1/8"`).
Numeric RC0 values are computed only at generation time via `params/transforms.ts`.

Inheritance: slots may reference `fxModuleId`; racks may reference module params with `overrides`.
Resolution happens in `config/resolve.ts` before `memoryConfigToRc0Pair()`.

---

## Key technical decisions

### 1. Dual distribution: plugin (consumer) + npm (developer)

| Path | MCP | Skill | Install |
|------|-----|-------|---------|
| **Consumer** | `.mcpb` bundle | embedded in plugin | double-click |
| **Developer** | `npx rc505mk2-mcp` (bin wrapper) | `npx skills add … --skill rc505mk2` | 2 commands |

MCP is required for USB/RC0. Skills teach workflow — they ship together but install via audience-appropriate packaging. See [DISTRIBUTION.md](./DISTRIBUTION.md).

### 2. Agent UX improvements (Phase 3.5 — before Phase 4)

On branch `phase-3/skill`, before any packaging work:

- **Server-side TFX validation** at preset create/update time
- **`upload_memory({ rack_id, slot_number })`** — collapse common upload path
- **MCP Test Run 2** — verify improvement vs Test Run 1

### 2. Local-first, no cloud

The Phase 5 platform split (Postgres + HTTP MCP + API keys) is removed.
User presets persist to `~/.rc505mk2/` as JSON files.

Rationale: zero ops cost, no accounts, works offline, matches “free tool” goal.

### 3. Single npm package (flattened monorepo)

Previously: root guide + `packages/web` + `packages/rc505mk2-lib`.
Now: one package at repo root. Simpler for contributors and `npx` distribution.

Target publish name: **`rc505mk2-mcp`** or **`@rc505mk2/mcp`** (decide in Phase 2).

### 4. macOS-first device support

Device code in `src/device/`:
- **macOS:** `diskutil` for eject; scan `/Volumes/` for `ROLAND/DATA`
- **Linux:** `/media`, `/mnt` scan; `umount`
- **Windows:** drive letter scan (basic support exists)

Primary dev/test platform: **macOS**. Document Linux/Windows as best-effort.

Bundling strategy for macOS users:
- No native binary required — pure Node.js + stdio MCP
- User needs Node 18+ (or bundled via `npx` which pulls node-compatible JS)
- Future: optional signed `.pkg` or Homebrew formula — out of scope for v1

### 5. Build toolchain

| Tool | Purpose |
|------|---------|
| **tsup** | Bundle ESM/CJS for `index`, `browser`, `node`; ESM bins for CLI + MCP |
| **TypeScript 5.9** | Strict mode |
| **Vitest** | Unit + integration tests |
| **tsx** | Run embed-template script at build time |

Build order: `npm run build:template` → `tsup`

Outputs:
- `dist/index.js` / `.cjs` — library API
- `dist/mcp/server.js` — MCP bin entry (`rc505mk2-mcp`)
- `dist/cli/generate-memories.js` — CLI bin (`rc505mk2`)

### 6. Dependencies

**Runtime (keep minimal):**

| Package | Purpose | Required |
|---------|---------|----------|
| `zod` | Schema validation | Yes |
| `fflate` | ZIP export | Yes |
| `@modelcontextprotocol/sdk` | MCP server | Yes (promote from peer to direct dep in Phase 2) |

**Dev:**

| Package | Purpose |
|---------|---------|
| `tsup` | Bundler |
| `tsx` | Script runner |
| `typescript` | Types |
| `vitest` | Tests |

**Explicitly NOT included:**

| Excluded | Was used for |
|----------|--------------|
| `next`, `react`, `tailwind` | Guide + web app |
| `drizzle-orm`, `@neondatabase/serverless` | Cloud preset platform |
| `next-auth` | User accounts |

### 7. MCP SDK as direct dependency (Phase 2)

Currently `@modelcontextprotocol/sdk` is a peer dependency.
For `npx` distribution, promote to direct dependency so install is one step.

### 8. Embedded default template

The RC-505mk2 requires a base RC0 template for generation.
Embedded at build time via `scripts/embed-template.ts` → `src/template/default-template.ts`.
Source fixture: `test/fixtures/default.rc0`.

This avoids runtime fetch of `/templates/default.rc0` (broken in old guide app).

### 9. Testing strategy

| Layer | What to test |
|-------|--------------|
| `params/` | Transform round-trips, param-map completeness |
| `generator/` + `parser/` | RC0 round-trip fidelity |
| `config/` | Inheritance resolve, merge |
| `mcp/handlers` | Tool input/output contracts (mock device for upload) |
| `device/` | Integration tests optional (need hardware); unit-test path logic |

Run: `npm test` from repo root.

### 10. Versioning & releases

Semver on the single package. MCP server version tracks package version.

Pre-1.0: breaking tool schema changes are acceptable while iterating.

---

## Module boundaries

```
@rc505mk2/mcp (public)
├── "."           → index.ts     (isomorphic API)
├── "./browser"   → browser.ts   (no node:fs — for future browser use)
└── "./node"      → node.ts      (device + file stores)

Bins:
├── rc505mk2-mcp  → dist/mcp/server.js
└── rc505mk2      → dist/cli/generate-memories.js
```

MCP handlers import from `../generator`, `../device`, etc. — no circular deps.

---

## Security model

- MCP server runs locally with the user’s permissions.
- `upload_memory` writes to USB mass storage — backs up before overwrite.
- No network calls in the MCP server (offline-capable except `npx` first install).
- User store at `~/.rc505mk2/` — standard user home dir permissions.

---

## Migration notes (from v1 monorepo)

| Old location | New location |
|--------------|--------------|
| `packages/rc505mk2-lib/src/` | `src/` |
| `packages/rc505mk2-lib/data/` | `data/` |
| `packages/rc505mk2-lib/test/` | `test/` |
| `packages/web/src/mcp/handlers.ts` | Port to `src/mcp/handlers-preset.ts` (Phase 1) |
| Root `src/` (guide app) | Removed |
| `packages/web/` | Removed |

Cloud handler reference is preserved in git history and `docs/archive/CONFIG-SYSTEM-PLAN.md`.
