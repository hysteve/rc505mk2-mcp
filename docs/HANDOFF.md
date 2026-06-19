# Session Handoff — RC-505mk2 MCP (June 2026)

> Short reference so the next session can continue without re-reading the full chat.  
> **Branch:** `phase-4/distribution` — Phase 4 in progress.

---

## Current state

| Item | Status |
|------|--------|
| Phase 0–2 | ✅ Merged (unified MCP, npm `rc505mk2-mcp`) |
| Phase 3 + 3.5 | ✅ Done — skill content, UX fixes, Test Runs 1–4 |
| Phase 4A | 🔄 In progress — `skills/` tree, slash skills, dev install docs |
| Phase 4B | 🔄 In progress — `plugin/manifest.json`, `npm run pack:plugin` |

**Plan:** [PROJECT_PLAN_V2.md](./PROJECT_PLAN_V2.md) (includes [slash skills plan](./PROJECT_PLAN_V2.md#slash-skills-plan))  
**Distribution:** [DISTRIBUTION.md](./DISTRIBUTION.md)

---

## Slash skills

| Command | Skill dir | Status |
|---------|-----------|--------|
| `/rc505mk2` | `skills/rc505mk2/` | ✅ synced from `docs/SKILL.md` |
| `/rc505-upload` | `skills/rc505-upload/` | ✅ |
| `/rc505-build-rack` | `skills/rc505-build-rack/` | ✅ |
| `/rc505-adapt-rack` | `skills/rc505-adapt-rack/` | ✅ |

Install: `npx skills add ./ --skill rc505mk2 --skill rc505-upload --skill rc505-build-rack --skill rc505-adapt-rack -a cursor`

---

## MCP test runs (summary)

| Run | Verdict |
|-----|---------|
| [1](./MCP%20Test%20Run%201%20-%20Claude%20Sonnet%204.md) | Pre-skill baseline |
| [2](./MCP%20Test%20Run%202%20-%20Claude%20Sonnet%204.md) | Adapt fluid; meta-search friction |
| [3](./MCP%20Test%20Run%203%20-%20Claude%20Sonnet%204.md) | Build partial fail |
| [4](./MCP%20Test%20Run%204%20-%20Claude%20Sonnet%204.md) | Build partial pass; duplicate-id fix ✅ |

---

## Phase 4 remaining

| Task | Status |
|------|--------|
| Verify `npx skills add ./` from local checkout | ✅ |
| Smoke test `.mcpb` in Claude Desktop | ⬜ |
| npm publish checklist | ⬜ |
| Optional: `npx rc505mk2-mcp init` | ⬜ |
| GitHub Release (Phase 5) | ⬜ |

**Build plugin:** `npm run pack:plugin` → `releases/rc505mk2-v0.2.0.mcpb`  
**Test prompts:** [TEST_PROMPTS.md](./TEST_PROMPTS.md)

---

## Key paths

```
docs/SKILL.md              # Umbrella skill source of truth
skills/rc505mk2/           # Synced via npm run sync:skills
skills/rc505-upload/       # Task skill
skills/rc505-build-rack/   # Task skill
skills/rc505-adapt-rack/   # Task skill
plugin/manifest.json       # MCPB manifest
scripts/pack-plugin.ts     # mcpb pack + skill ZIP
.cursor/skills/rc505mk2/   # Cursor dev pointer
src/mcp/validate-rack.ts   # TFX Slot A server validation
```

---

## Do not lose

- **Primary users are non-technical** — `.mcpb` is the main path  
- **Skill + MCP ship together** — tools alone are not enough  
- **Adapt vs Build** — genre prompts default to Adapt; explicit "from scratch" = Build  
- **Task slash skills** — thin workflows; umbrella keeps hardware rules

---

## Slated enhancements

| Phase | Feature | Spec |
|-------|---------|------|
| 6 | **Inspire Me** — surprise / options / wizard / session blueprints | [INSPIRE.md](./INSPIRE.md) |

**Branch (when started):** `phase-6/inspire`
