# Session Handoff — RC-505mk2 MCP (June 2026)

> Short reference so the next session can continue without re-reading the full chat.  
> **Branch:** `phase-4/distribution` — Phase 4 mostly done; **4C bundle polish** next.

---

## Current state

| Item | Status |
|------|--------|
| Phase 0–3.5 | ✅ Merged |
| Phase 4A | ✅ Skills tree, `npx skills add`, dev docs |
| Phase 4B | ✅ MCPB manifest, `pack:plugin`, build UX fixes (committed `a58e8ef`) |
| Phase 4C | ⬜ **Next session** — host clarity, Desktop workflow layer, Claude Code plugin |
| Phase 5 | ⬜ Marketplace / GitHub Release |
| Phase 6 | ⬜ Inspire Me — [INSPIRE.md](./INSPIRE.md) |

**Plan:** [PROJECT_PLAN_V2.md](./PROJECT_PLAN_V2.md) · **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md#plugin-vs-skill-vs-mcp-server) · **Distribution:** [DISTRIBUTION.md](./DISTRIBUTION.md)

---

## Plugin vs Skill vs MCP (read this first)

| Layer | What | Runs code? | Claude Desktop `.mcpb` | Claude Code / Cursor |
|-------|------|------------|------------------------|----------------------|
| **MCP server** | 21 tools — USB, RC0, presets | **Yes** | ✅ Installed | ✅ via MCP config |
| **Skill** | `SKILL.md` workflow playbook | No (ours) | ❌ **Not slash cmds** | ✅ `/rc505-*` via `npx skills add` |
| **MCPB plugin** | Packaging for Desktop | Installs MCP + **manifest prompts** | ✅ Double-click | N/A |
| **Claude Code plugin** | `.claude-plugin/` + `.mcp.json` | Wires MCP + slash skills | N/A | ⬜ Phase 4C/5 |

**Key insight:** Skills bundled inside `.mcpb` are **files on disk**, not registered as `/rc505-upload` in Claude Desktop. Desktop users get **tools + extension starter prompts + natural language**. Slash commands require Claude Code plugin or `npx skills add` (Cursor/Code).

**MCP Test 5 (Plugin):** [doc](./MCP%20Test%205%20-%20Claude%20Sonnet%204%20(Plugin).md) — mostly working; slot/bank + param coercion fixed server-side.

---

## Slash skills (dev / Claude Code / Cursor)

| Command | Skill dir | Status |
|---------|-----------|--------|
| `/rc505mk2` | `skills/rc505mk2/` | ✅ |
| `/rc505-upload` | `skills/rc505-upload/` | ✅ |
| `/rc505-build-rack` | `skills/rc505-build-rack/` | ✅ |
| `/rc505-adapt-rack` | `skills/rc505-adapt-rack/` | ✅ |

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

## Next session — Phase 4C todos

Priority order for getting the bundle into **ideal form**:

| # | Task | Why |
|---|------|-----|
| 1 | **MCP server `instructions` on initialize** — condensed Adapt/Build, fxModuleId, TFX bank/slot rules | Gives Claude Desktop skill-like behavior without slash cmds |
| 2 | **Claude Code plugin wrapper** — `plugin/claude-code/.claude-plugin/plugin.json` + `.mcp.json` + skills paths | Enables `/rc505-*` slash commands + hooks like other marketplace plugins |
| 3 | **Clarify consumer UX in README** — Desktop = tools + manifest prompts; slash skills = Code/Cursor only | Sets correct expectations |
| 4 | **Retest breakdown rack prompt** after repack + reinstall | Verify single-shot `create_rack_preset` ([Test 5 retest](./MCP%20Test%205%20-%20Claude%20Sonnet%204%20(Plugin).md)) |
| 5 | **Smoke test `.mcpb`** — install, prompts visible, upload flow | Phase 4B exit criteria |
| 6 | **Merge `phase-4/distribution` → `main`** | After 4C or if 4C split to follow-up PR |
| 7 | Optional: **`npx rc505mk2-mcp init`** — auto-write MCP config | Dev polish |
| 8 | Optional: **npm publish checklist** | Phase 4A exit |

**Not next session:** Phase 6 Inspire Me, GitHub Release (Phase 5) — unless 4C finishes early.

---

## Phase 4 / 5 remaining (backlog)

| Task | Phase |
|------|-------|
| GitHub Release for `.mcpb` + skill ZIP | 5 |
| Claude Desktop Extensions directory submit | 5 |
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
plugin/claude-code/          # (planned) Claude Code plugin — slash skills
scripts/pack-plugin.ts       # mcpb pack + skill ZIP
src/mcp/normalize-rack-input.ts  # fxModuleId + param coercion
src/mcp/server.ts            # (planned) initialize instructions
```

---

## Do not lose

- **Primary users are non-technical** — `.mcpb` is the main path  
- **MCP server does device/RC0** — skills are workflow docs, not a replacement  
- **Claude Desktop ≠ Claude Code** — slash skills and hooks are Code/Cursor; Desktop gets MCP tools + prompts  
- **Adapt vs Build** — genre prompts default to Adapt; explicit "from scratch" = Build  
- **Repack → reinstall** — Desktop keeps a copy; doesn't hot-reload from `releases/`
