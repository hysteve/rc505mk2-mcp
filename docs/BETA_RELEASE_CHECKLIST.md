# Beta Release Checklist

> Run through before posting on Reddit or sharing the `.mcpb` widely.  
> Marketing copy: [MARKETING.md](./MARKETING.md)

---

## Must-do before beta

| # | Task | Status |
|---|------|--------|
| 1 | **Merge `phase-4/distribution` → `main`** | ⬜ |
| 2 | **Fresh build + pack** — `npm run build && npm run pack:plugin` | ⬜ |
| 3 | **Smoke test `.mcpb`** on your machine — install, tools visible, one upload | ⬜ |
| 4 | **GitHub Release** — attach `rc505mk2-v0.2.0.mcpb`, write release notes from [MARKETING.md](./MARKETING.md) | ⬜ |
| 5 | **README beta banner** — link to Release, set expectations (beta, skills WIP) | ⬜ |
| 6 | **GitHub Issues enabled** — add `beta-feedback` label; optional issue template | ⬜ |
| 7 | **One screenshot or GIF** for Reddit / Release | ⬜ |

---

## Strongly recommended

| # | Task | Why |
|---|------|-----|
| 8 | **Retest breakdown rack prompt** ([MCP Test 5](./MCP%20Test%205%20-%20Claude%20Sonnet%204%20(Plugin).md)) after repack | Validates greenfield build flow |
| 9 | **Run `npm test`** on clean checkout | 421 tests — quick confidence |
| 10 | **Run `npx rc505mk2 doctor`** with device connected | Copy output into known-issues if anything flaky |
| 11 | **Decide license** — currently `UNLICENSED` in package.json | Beta testers may ask; MIT/Apache common for OSS |
| 12 | **Known limitations doc** (short) — link from Release notes | Reduces duplicate "it didn't read my mind" issues |
| 13 | **Windows smoke test** (or friend) | Manifest claims win32; beta was macOS-heavy |
| 14 | **Backup reminder in README** | Upload overwrite/merge — users should know merge mode |

---

## Nice-to-have (post-beta)

| Task | Phase |
|------|-------|
| Improve agent skills — practical workflows, not generic playbooks | Backlog |
| `npx rc505mk2-mcp init` — auto-write MCP config | 4A optional |
| npm publish for dev `npx` path | 5 |
| Claude Desktop Extensions directory | 5 — after beta feedback |
| Inspire Me feature | 6 — [INSPIRE.md](./INSPIRE.md) |
| GitHub Discussions for preset sharing | Community |

---

## Known beta limitations (publish these)

Copy into Release notes or pin a GitHub Issue:

1. **Beta quality** — expect rough edges; report issues rather than assuming it's finished
2. **Claude Desktop only** for one-click install; Cursor/Code need dev setup
3. **Agent skills under development** — not part of the beta value prop; Desktop uses tools + natural language
4. **Complex racks** may require a follow-up prompt or retry (slot/bank terminology still trips models occasionally)
5. **Not marketplace-listed** — manual `.mcpb` download from GitHub Releases
6. **mk2 only** — not compatible with RC-505 mk1 or other loopers
7. **UNLICENSED** until you pick a license — clarify if sharing source

---

## Release notes template

```markdown
## RC-505mk2 Assistant v0.2.0 (Beta)

Local Claude Desktop extension for the Roland RC-505mk2 — browse FX racks, build custom configs, upload to memory slots via USB.

### Install
1. Download `rc505mk2-v0.2.0.mcpb` below
2. Double-click → Install in Claude Desktop
3. Connect RC-505mk2 in USB Storage mode
4. Try: "List bundled rack presets"

**Prefer to build yourself?** Clone the repo → `npm install && npm run build && npm run pack:plugin` → install `releases/rc505mk2-v0.2.0.mcpb`.

### Includes
- 21 MCP tools (browse, build, upload, device detect)
- 43 bundled rack presets + 33 FX modules
- MCP server instructions for Desktop workflow

### Beta notes
- Looking for feedback — please open Issues
- Agent skills (slash commands) are under development — not required for Desktop
- Tested primarily on macOS; please report Windows/Linux issues

### Requirements
- Claude Desktop (extensions support)
- Roland RC-505mk2
- USB cable

Not affiliated with Roland or Anthropic.
```

---

## Suggested beta feedback questions

Ask testers to report:

1. OS + Claude Desktop version
2. Did install work first try?
3. Did `detect_device` / `upload_memory` work?
4. What prompt did you try? What happened?
5. Would you use this before a gig? Why / why not?

---

## Code cleanup — low priority for beta

These improve polish but aren't blockers:

- Remove stale `plugin/.release/` artifacts locally (not tracked)
- Align README "76 lines" vs full README if truncated view was a display glitch
- Issue templates: `bug_report.md`, `beta_feedback.md`

**Don't block beta for:** marketplace submission, npm publish, skill rewrites, Inspire Me.
