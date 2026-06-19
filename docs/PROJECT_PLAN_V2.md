# RC-505mk2 MCP Server — Project Plan v2

> **Goal:** A free, local-first assistant for the Roland RC-505mk2 loop station.
> **Consumers** install one plugin and talk to Claude in plain language.
> **Developers** run two `npx` commands for MCP + skill. Same engine, two packaging paths.

**Status:** Phase 4A/4B done on `phase-4/distribution` (commit `a58e8ef`). **Phase 4C** (bundle polish) is next session.

---

## Background

This repo evolved through several phases:

1. **Guide website** — static FX rack reference (rc505guide.com)
2. **Preset generator** — RC0 file generation from human-readable params
3. **RCO mapping** — exhaustive param-map, transforms, effect-map for all FX types
4. **Device MCP** — stdio MCP server for USB detect/upload/eject
5. **Platform split** — Postgres web app + cloud MCP (never shipped)

**Decision (2026-06):** Drop website, web app, cloud MCP. Ship one unified local MCP server.

**Decision (2026-06, revised):** Dual distribution — `.mcpb` plugin for consumers, `npx` for developers. See [DISTRIBUTION.md](./DISTRIBUTION.md).

---

## Target end state

```
rc505mk2/
├── src/                          # engine + MCP server
├── data/                         # bundled presets
├── skills/
│   ├── rc505mk2/                 # Umbrella workflow skill → /rc505mk2
│   ├── rc505-upload/             # Task skill → /rc505-upload
│   ├── rc505-build-rack/         # Task skill → /rc505-build-rack
│   └── rc505-adapt-rack/         # Task skill → /rc505-adapt-rack
├── docs/SKILL.md                 # source of truth (synced to skills/rc505mk2/)
├── plugin/                       # MCPB manifest + assets → .mcpb
├── releases/                     # .mcpb + skill ZIP
├── package.json                  # npm → npx rc505mk2-mcp, rc505mk2 CLI bins
└── README.md                     # consumer install first, dev quick-start second
```

| Path | Install | Audience |
|------|---------|----------|
| **Consumer** | Download `rc505mk2.mcpb` → double-click → Install | RC-505 owners, Claude Desktop |
| **Developer** | `npx rc505mk2-mcp` + `npx skills add <repo> --skill …` | Devs, Cursor, Claude Code |

Slash skills (`/rc505-*`) ship via **`npx skills add`** (Cursor, Claude Code) and the **Claude Code plugin** (Phase 4C). They are bundled as files inside `.mcpb` but **do not register as slash commands in Claude Desktop** — Desktop users rely on MCP tools, manifest **prompts**, and (planned) server **instructions**. See [ARCHITECTURE.md](./ARCHITECTURE.md#plugin-vs-skill-vs-mcp-server).

See also: [DISTRIBUTION.md](./DISTRIBUTION.md), [UNIFIED_MCP_TOOLS.md](./UNIFIED_MCP_TOOLS.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [AGENT_WORKFLOW.md](./AGENT_WORKFLOW.md), [LIBRARY.md](./LIBRARY.md).

---

## Slash skills plan

Task-specific slash skills complement the umbrella `rc505mk2` skill. Each is a thin, invocable workflow (`disable-model-invocation: true` where supported) so users can steer the agent without re-explaining mode rules.

| Slash command | Skill dir | When to use | Core tool path |
|---------------|-----------|-------------|----------------|
| **`/rc505mk2`** | `skills/rc505mk2/` | Default — any RC-505 MCP task; agent picks Adapt vs Build | Full playbook in `docs/SKILL.md` |
| **`/rc505-upload`** | `skills/rc505-upload/` | Load or save a rack to a device memory slot | `detect_device` → `upload_memory { rack_id, slot_number }` → `eject_device` |
| **`/rc505-build-rack`** | `skills/rc505-build-rack/` | Greenfield rack from FX modules only | `list_fx_modules` (ifx + tfx) → `create_rack_preset` — no preset browse |
| **`/rc505-adapt-rack`** | `skills/rc505-adapt-rack/` | Genre/style rack from bundled presets | `list_rack_presets` → adapt / `get_rack_preset` → save or upload |
| **`/rc505-inspire`** *(Phase 6)* | `skills/rc505-inspire/` | Stuck at inspiration — surprise, options, or wizard | `inspire_me` / `inspire_wizard` → upload or adapt |

**Design rules:**

- Umbrella skill stays the **source of truth** for hardware rules (IFX vs TFX, special Slot A, tips schema, merge vs overwrite).
- Task skills are **trimmed copies** — one workflow, explicit tool budget, link to umbrella for edge cases.
- Consumer `.mcpb` bundles skill **files** + manifest starter prompts — not Desktop slash commands.
- Claude Code plugin (Phase 4C) registers slash skills for `/plugin install` users.
- Install: `npx skills add <repo> --skill rc505mk2 --skill rc505-upload --skill rc505-build-rack --skill rc505-adapt-rack` (or `-g` for all skills in repo).

**Phase assignment:**

| Skill | Phase |
|-------|-------|
| `rc505mk2` (umbrella) | Phase 4A — sync from `docs/SKILL.md` |
| `rc505-upload`, `rc505-build-rack`, `rc505-adapt-rack` | Phase 4A or early Phase 5 — author after umbrella ships |
| Bundle all skills in `.mcpb` + skill ZIP | Phase 4B |
| Claude Code plugin (slash skills + `.mcp.json`) | Phase 4C |
| MCP server `instructions` on initialize (Desktop workflow) | Phase 4C |

**Not planned:** per-genre slash skills (`/rc505-dnb`, `/rc505-neosoul`) — genre is a filter on Adapt/Build, not a separate skill surface.

**Planned (Phase 6):** `/rc505-inspire` — curated inspiration, wizard Q&A, session blueprints. See [INSPIRE.md](./INSPIRE.md).

---

## Phases

### Phase 0 — Cleanup & flatten ✅

**Branch:** `phase-0/cleanup`

---

### Phase 1 — Unified MCP server ✅

**Branch:** `phase-1/unified-mcp`

---

### Phase 2 — npm distribution ✅

**Goal:** Publishable npm package with executable bin wrappers.

| Task | Status |
|------|--------|
| Package name `rc505mk2-mcp` | ✅ |
| Bin wrappers: `rc505mk2-mcp`, `rc505mk2` | ✅ |
| `npx` one-liner MCP config | ✅ |
| Bundle `data/` in npm `files` | ✅ |
| `rc505mk2 doctor` CLI | ✅ |

**Branch:** `phase-2/distribution`

---

### Phase 3 — Agent skill content ✅

**Goal:** Workflow knowledge — source material for plugin and `npx skills add`.

| Task | Status |
|------|--------|
| Author `docs/SKILL.md` | ✅ |
| Improve tool descriptions (MCP Test Run 1 learnings) | ✅ |
| Example prompts table | ✅ |
| Adapt vs Build modes, pairsWith, Test Runs 2–4 | ✅ |
| Build-mode duplicate-id + meta-search guidance | ✅ |

**Branch:** `phase-3/skill` — **merged to `main`**

---

### Phase 3.5 — Agent UX improvements ✅

**Goal:** Reduce LLM friction with server-side fixes identified in [MCP Test Run 1](./MCP%20Test%20Run%201%20-%20Claude%20Sonnet%204.md). No packaging work in this phase.

| Task | Status |
|------|--------|
| **Server-side TFX validation** — reject BEAT_SCATTER, BEAT_REPEAT, BEAT_SHIFT, VINYL_FLICK outside TFX Slot A (and >1 per bank) in `create_rack_preset` / `update_rack_preset` | ✅ |
| **`upload_memory` accepts `rack_id`** (+ `slot_number`, optional `name`) — resolves rack → config internally; skip separate `build_rack_config` for common upload path | ✅ |
| Tests for validation + `upload_memory` rack_id path | ✅ |
| Update tool descriptions + `docs/SKILL.md` workflows (Adapt/Build, pairsWith, direct tool calls) | ✅ |
| **MCP Test Run 2** — document session; Test Run 3 prompts for Build/Adapt verification | ✅ |
| **MCP Test Run 3** — Build mode partial fail; see [doc](./MCP%20Test%20Run%203%20-%20Claude%20Sonnet%204.md) | ✅ |
| **MCP Test Run 4** — duplicate-id fix validated; [doc](./MCP%20Test%20Run%204%20-%20Claude%20Sonnet%204.md) | ✅ |

**Exit criteria:** Invalid special-TFX placement returns clear server error; "upload rack X to slot N" is one tool call; Test Runs 2–4 documented.

**Branch:** `phase-3/skill` — **merged to `main`**

---

### Phase 4 — Dual distribution

**Goal:** Ship consumer plugin + dev install path + slash skills. **Start on `phase-4/distribution`.**

#### 4A — Developer install path

| Task | Status |
|------|--------|
| Add `skills/rc505mk2/` tree synced from `docs/SKILL.md` | ✅ |
| Add task slash skills: `rc505-upload`, `rc505-build-rack`, `rc505-adapt-rack` | ✅ |
| Document dev quick-start: `claude mcp add` + `npx skills add` (all skills) | ✅ |
| Optional: `npx rc505mk2-mcp init` — auto-write MCP config for detected client | ⬜ |
| Verify `npx skills add ./ --skill rc505mk2` from local checkout | ✅ |
| npm publish checklist (bins, files, version) | ⬜ |

**Exit criteria:** Developer with Node 18+ runs two commands, has MCP + skill, passes `doctor`.

#### 4B — Consumer plugin bundle

| Task | Status |
|------|--------|
| Create `plugin/manifest.json` (metadata, icon, starter prompts) | ✅ |
| Bundle all four slash skills in `.mcpb` + skill ZIP export | ✅ |
| `npm run pack:plugin` — `mcpb pack` + skill ZIP export | ✅ |
| Package built server + `data/` into `.mcpb` | ✅ |
| Smoke test: double-click install in Claude Desktop | ⬜ |
| README: consumer install (download-first) | ✅ |
| Build-mode UX: `normalize-rack-input`, TFX bank validation | ✅ |
| [MCP Test 5 (Plugin)](./MCP%20Test%205%20-%20Claude%20Sonnet%204%20(Plugin).md) documented | ✅ |

**Exit criteria:** Non-dev user downloads `.mcpb`, installs, uploads a bundled rack via natural language.

**Branch:** `phase-4/distribution`

#### 4C — Bundle polish & host clarity *(next session)*

**Goal:** Close the gap between “tools work” and “workflow feels guided” per host. Clarify Plugin vs Skill vs MCP.

| Task | Status |
|------|--------|
| MCP server **`instructions` on `initialize`** — condensed SKILL.md (Adapt/Build, fxModuleId, TFX layout) | ⬜ |
| **Claude Code plugin** — `plugin/claude-code/.claude-plugin/plugin.json` + `.mcp.json` + skills array | ⬜ |
| Document **host matrix** in ARCHITECTURE (Desktop vs Code vs Cursor) | ⬜ |
| README: Desktop = tools + prompts; slash skills = Code/Cursor only | ⬜ |
| Retest breakdown rack prompt after repack ([Test 5](./MCP%20Test%205%20-%20Claude%20Sonnet%204%20(Plugin).md)) | ⬜ |
| Merge `phase-4/distribution` → `main` | ⬜ |

**Exit criteria:** Claude Desktop users get workflow guidance without slash cmds; Claude Code users get `/rc505-*` via plugin install.

**Branch:** `phase-4/distribution` (or `phase-4/bundle-polish`)

---

### Phase 5 — Marketplace & reach

**Goal:** Discoverability at scale (after Phase 4 plugin ships).

| Task | Status |
|------|--------|
| GitHub Releases for `.mcpb` + skill ZIP | ⬜ |
| Submit to Claude Desktop Extensions directory | ⬜ |
| Submit **Claude Code plugin** to claude-plugins-official (or external) | ⬜ |
| Optional: skills.sh / agent skill registry listing | ⬜ |
| Claude.ai skill ZIP + upload instructions | ⬜ |
| Linux/Windows device upload hardening | ⬜ |

**Branch:** `phase-5/marketplace`

---

### Phase 6 — Creative enhancements (Inspire Me)

**Goal:** Help users who are stuck at the inspiration step — curated picks, guided Q&A, and session blueprints. Server-backed quality + conversational skill.

**Spec:** [INSPIRE.md](./INSPIRE.md)

#### 6A — Foundation

| Task | Status |
|------|--------|
| `list_genre_templates` MCP tool | ⬜ |
| `inspire_me` tool (random + options modes) | ⬜ |
| `src/data/inspire-pools.json` — tier-1 allowlist + vibe maps | ⬜ |
| Variety history (`~/.rc505mk2/inspire-history.json`) | ⬜ |
| `skills/rc505-inspire/` slash skill | ⬜ |
| Plugin manifest starter prompt + bundle in `.mcpb` | ⬜ |
| Tests + MCP Test Run 5 doc | ✅ (Plugin test — see [Test 5](./MCP%20Test%205%20-%20Claude%20Sonnet%204%20(Plugin).md)) |
| Update `UNIFIED_MCP_TOOLS.md`, `TEST_PROMPTS.md` | ⬜ |

**Exit criteria:** *“Inspire me”* returns 1–3 curated picks in one tool call; genre templates browsable.

#### 6B — Wizard & sessions

| Task | Status |
|------|--------|
| `inspire_wizard` (stateless multi-step Q&A) | ⬜ |
| `inspire_session` — 5-track blueprint + rack mapping | ⬜ |
| Multi-slot upload suggestions (links to upload flow) | ⬜ |

**Exit criteria:** Wizard completes in ≤ 5 questions; full session returns track map with rack IDs.

#### 6C — Polish (optional)

| Task | Status |
|------|--------|
| `inspireTier` metadata on racks (replace allowlist) | ⬜ |
| CLI: `rc505mk2 inspire` | ⬜ |

**Branch:** `phase-6/inspire`

---

### Phase 7 — Future (demand-driven)

- `read_device_slot` tool (read RC0 from device)
- Rack preset CRUD UI
- Separate archive repo for rc505guide.com

---

## Distribution summary

| Audience | Host | MCP | Workflow layer | Install |
|----------|------|-----|----------------|---------|
| Consumer | Claude Desktop | `.mcpb` | manifest **prompts** + server **instructions** (4C) | double-click |
| Developer | Cursor / Claude Code | `npx rc505mk2-mcp` | **`npx skills add`** → `/rc505-*` slash skills | 2 commands |
| Developer | Claude Code | plugin `.mcp.json` | plugin **skills/** + **commands/** (4C) | `/plugin install` |

Full detail: [DISTRIBUTION.md](./DISTRIBUTION.md) · [ARCHITECTURE.md](./ARCHITECTURE.md#plugin-vs-skill-vs-mcp-server).

---

## Agent UX targets (Test Run 2)

Baseline from [MCP Test Run 1](./MCP%20Test%20Run%201%20-%20Claude%20Sonnet%204.md):

| Issue (Run 1) | Fix (Phase 3.5) |
|---------------|----------------|
| Tips schema error on first `create_rack_preset` | Skill + tool descriptions (Phase 3); server validation messages |
| BEAT_SCATTER in wrong slot (LLM caught it) | Server-side TFX Slot A validation |
| Extra `build_rack_config` before upload | `upload_memory({ rack_id, slot_number })` |
| ~8+ exploratory tool calls | Skill + browse-first guidance; measure in Test Run 2 |

| Metric | Run 1 (approx) | Run 2 target |
|--------|----------------|--------------|
| Tool calls: create DnB rack + upload | ~12+ | ≤ 6 |
| Tool calls: load bundled rack → slot N | ~6 | ≤ 4 |
| Server/schema errors | 1+ | 0 |

---

## What was removed

| Removed | Reason |
|---------|--------|
| Cloud platform | Local-first |
| Cursor skill as separate deliverable | `npx skills add` covers all agents |
| JSON config as primary onboarding | Consumer `.mcpb` + dev `npx` |

## What was kept

| Kept | Reason |
|------|--------|
| npm package + bin wrappers | Dev path + MCPB build input |
| `docs/SKILL.md` | Source of truth for all skill installs |
| `test/` | Generator + handler regressions |

---

## Reference: old cloud MCP handlers

```
packages/web/src/mcp/handlers.ts   (deleted in Phase 0)
packages/web/src/mcp/tools.ts      (deleted in Phase 0)
```

Generation delegates to `src/index.ts`.
