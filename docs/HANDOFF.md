# Session Handoff — RC-505mk2 MCP (June 2026)

> Short reference so the next session can continue without re-reading the full chat.  
> **Branch:** `phase-4/distribution` — **Phase 4 ~done**; beta distribution next.

---

## Current state

| Item | Status |
|------|--------|
| Phase 0–3.5 | ✅ Merged |
| Phase 4A | ✅ Skills tree, `npx skills add`, dev docs |
| Phase 4B | ✅ MCPB manifest, `pack:plugin`, build UX fixes (committed `a58e8ef`) |
| Phase 4C | ✅ **~done** — MCP instructions, plugin zip path dropped, marketing docs |
| Phase 5 | ⬜ Beta via GitHub Release — marketplace TBD after feedback |
| Phase 6 | ⬜ Inspire Me — [INSPIRE.md](./INSPIRE.md) |

**Beta:** [MARKETING.md](./MARKETING.md) · [BETA_RELEASE_CHECKLIST.md](./BETA_RELEASE_CHECKLIST.md)

**Plan:** [PROJECT_PLAN_V2.md](./PROJECT_PLAN_V2.md) · **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md#plugin-vs-skill-vs-mcp-server) · **Distribution:** [DISTRIBUTION.md](./DISTRIBUTION.md)

---

## Plugin vs Skill vs MCP (read this first)

| Layer | What | Runs code? | Claude Desktop `.mcpb` | Claude Code / Cursor |
|-------|------|------------|------------------------|----------------------|
| **MCP server** | 21 tools — USB, RC0, presets | **Yes** | ✅ Installed | ✅ via MCP config |
| **Skill** | `SKILL.md` workflow playbook | No (ours) | ❌ **Not slash cmds** | ✅ `/rc505-*` via `npx skills add` |
| **MCPB plugin** | Packaging for Desktop | Installs MCP + **manifest prompts** | ✅ Double-click | N/A |
| **Claude Code plugin** | `.claude-plugin/` + `.mcp.json` | Wires MCP + slash skills | N/A | Optional via `npx skills add` (not a bundled plugin zip) |

**Key insight:** Skills bundled inside `.mcpb` are **files on disk**, not registered as `/rc505-upload` in Claude Desktop. Desktop users get **tools + extension starter prompts + natural language**. Slash commands require Claude Code plugin or `npx skills add` (Cursor/Code).

**MCP Test 5 (Plugin):** [doc](./MCP%20Test%205%20-%20Claude%20Sonnet%204%20(Plugin).md) — mostly working; slot/bank + param coercion fixed server-side.

---

## Slash skills (under development — not beta focus)

> **Status: WIP.** Skills exist for Cursor/Claude Code but are **not polished or practical enough** for the release story. Beta testers should use **natural language + MCP tools** (Desktop) or dev MCP config — not slash commands.  
> **Next:** Redesign skills for real-world workflows (upload-before-gig, genre quick-picks, merge vs overwrite guardrails).

| Command | Skill dir | Status |
|---------|-----------|--------|
| `/rc505mk2` | `skills/rc505mk2/` | 🚧 Under development |
| `/rc505-upload` | `skills/rc505-upload/` | 🚧 Under development |
| `/rc505-build-rack` | `skills/rc505-build-rack/` | 🚧 Under development |
| `/rc505-adapt-rack` | `skills/rc505-adapt-rack/` | 🚧 Under development |

```bash
npx skills add ./ --skill rc505mk2 --skill rc505-upload --skill rc505-build-rack --skill rc505-adapt-rack -a cursor -a claude-code
```

---

## MCP test runs (summary)

| Run | Verdict |
|-----|---------|
| [1](./MCP%20Test%20Run%201%20-%20Claude%20Sonnet%204.md) | Pre-skill baseline |
| [2](./MCP%20Test%20Run%202%20-%20Claude%20Sonnet%204.md) | Adapt fluid; meta-search friction |
| [3](./MCP%20Test%20Run%203%20-%20Claude%20Sonnet%204.md) | Build partial fail |
| [4](./MCP%20Test%20Run%204%20-%20Claude%20Sonnet%204.md) | Build partial pass; duplicate-id fix ✅ |
| [5 (Plugin)](./MCP%20Test%205%20-%20Claude%20Sonnet%204%20(Plugin).md) | Desktop `.mcpb`; create-rack friction fixed post-run |

---

## Next session — beta launch

| # | Task | Status |
|---|------|--------|
| 1 | Merge `phase-4/distribution` → `main` | ⬜ |
| 2 | GitHub Release + `.mcpb` attach | ⬜ |
| 3 | Smoke test + screenshot for Reddit | ⬜ |
| 4 | Post beta (see [MARKETING.md](./MARKETING.md)) | ⬜ |
| 5 | **Improve skills** — practical workflows, de-emphasize until ready | ⬜ Backlog |
| 6 | Marketplace listing | ⬜ After beta — maybe never |

**Phase 4C (done):** MCP instructions ✅ · plugin zip dropped ✅ · marketing docs ✅

**Optional before post:** retest breakdown rack ([Test 5](./MCP%20Test%205%20-%20Claude%20Sonnet%204%20(Plugin).md)) · [BETA_RELEASE_CHECKLIST.md](./BETA_RELEASE_CHECKLIST.md)

---

## Phase 4 / 5 remaining (backlog)

| Task | Phase |
|------|-------|
| GitHub Release for `.mcpb` | 5 — **beta now** |
| Reddit / beta outreach | 5 |
| **Redesign agent skills** — more practical workflows | Post-beta |
| Claude Desktop Extensions directory submit | 5 — after beta, if at all |
| `npx rc505mk2-mcp init` | 4A optional |
| npm publish checklist | 4A |
| Inspire Me tools + skill | 6 — [INSPIRE.md](./INSPIRE.md) |

**Build plugin:** `npm run build && npm run pack:plugin` → `releases/rc505mk2-v0.2.0.mcpb` (reinstall in Desktop after repack)

**Test prompts:** [TEST_PROMPTS.md](./TEST_PROMPTS.md)

---

## Key paths

```
docs/SKILL.md              # Umbrella skill source of truth
skills/                      # npx skills add + bundled in .mcpb (not Desktop slash cmds)
plugin/manifest.json         # MCPB — MCP server + manifest prompts
scripts/pack-plugin.ts       # mcpb pack + skill ZIP
src/mcp/normalize-rack-input.ts  # fxModuleId + param coercion
src/mcp/instructions.ts      # MCP initialize instructions (Desktop workflow)
src/mcp/server.ts            # MCP server (instructions on initialize)
```

---

## Do not lose

- **Primary users are non-technical** — `.mcpb` is the main path  
- **MCP server does device/RC0** — skills are workflow docs, not a replacement  
- **Skills are under development** — not the beta release focus; improve post-feedback  
- **Claude Desktop ≠ Claude Code** — slash skills are Code/Cursor only; Desktop gets MCP tools + prompts + instructions  
- **Adapt vs Build** — genre prompts default to Adapt; explicit "from scratch" = Build  
- **Repack → reinstall** — Desktop keeps a copy; doesn't hot-reload from `releases/`
