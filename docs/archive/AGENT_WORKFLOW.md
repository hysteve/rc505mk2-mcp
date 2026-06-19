# Agent Workflow — Incremental Phase Development

> Instructions for AI agents (and humans) working through [PROJECT_PLAN_V2.md](./PROJECT_PLAN_V2.md) phases.
> Follow this for clean, reviewable incremental progress.

---

## Golden rules

1. **One phase per branch** — never mix Phase 1 MCP work with Phase 2 distribution in the same PR.
2. **Build + test before every commit** — `npm run build && npm test` must pass.
3. **Minimal diffs** — only touch files required for the current phase task.
4. **Update phase checkboxes** in `PROJECT_PLAN_V2.md` when tasks complete.
5. **Do not commit** unless the user explicitly asks.

---

## Starting a phase

```bash
# From repo root
git checkout main
git pull
git checkout -b phase-N/short-description   # e.g. phase-1/unified-mcp

npm install
npm run build
npm test
```

Confirm clean baseline before making changes.

---

## During development

### Build cycle (run after meaningful changes)

```bash
npm run build && npm test
```

### Run MCP server locally (smoke test)

```bash
npm run build
node dist/mcp/server.js
# Server speaks stdio — send JSON-RPC via MCP client or Cursor MCP panel
```

### Test a single file

```bash
npx vitest run test/mcp-handlers.test.ts
```

### Lint / typecheck

TypeScript strict mode is enforced at build time via `tsup` + `tsc` declarations.
If IDE reports errors, run `npm run build` to confirm.

---

## Phase-specific guidance

### Phase 0 (cleanup)

- Delete only what PROJECT_PLAN_V2 lists as removable.
- Archive docs, don’t delete historical context.
- After flattening: grep for stale paths.

```bash
# Verify no stale references
rg "packages/web|packages/rc505mk2-lib|@rc505mk2/web" --glob '!docs/**' --glob '!node_modules/**'
```

### Phase 1 (unified MCP)

- Read [UNIFIED_MCP_TOOLS.md](./UNIFIED_MCP_TOOLS.md) before adding tools.
- Implement `PresetStore` before wiring handlers.
- Port cloud handler **logic**, not Drizzle repos — use file stores.
- Add tests for each new handler before marking task complete.
- Keep existing 6 device/reference tools working throughout.

Suggested commit chunks (if user asks to commit):
1. `PresetStore` + rack/memory stores
2. Preset browse handlers + tests
3. Preset CRUD handlers + tests
4. Wire into server.ts + update tool definitions
5. Docs update

### Phase 2 (distribution)

- Test `npx` from a temp directory outside the repo.
- Verify bundled `data/` resolves correctly when installed as dependency.
- Update README with copy-paste MCP config.

### Phase 3 (agent skill content) ✅

- Author [SKILL.md](./SKILL.md), improve tool descriptions.
- Branch: `phase-3/skill`

### Phase 3.5 (agent UX — active on `phase-3/skill`, before Phase 4)

- Server-side TFX Slot A validation
- `upload_memory` accepts `rack_id` + `slot_number`
- Tests + update `docs/SKILL.md`
- MCP Test Run 2 → `docs/MCP Test Run 2.md`
- **Do not start Phase 4 packaging until 3.5 merges.**

### Phase 4 (dual distribution)

Work order: **4A dev path → 4B consumer plugin**.

- `skills/rc505mk2/` + `npx skills add`
- `plugin/manifest.json` + `mcpb pack`

### Phase 5 (marketplace)

- GitHub Releases, Claude Desktop Extensions directory

---

## Ending a phase

```bash
# Full verification
npm run build
npm test
rg "packages/web|TODO.*phase" src/ test/   # no stale refs

# Optional: run CLI smoke test
node dist/cli/generate-memories.js --help
```

Update `docs/PROJECT_PLAN_V2.md`:
- Mark completed tasks ✅
- Note any deferred items

If user requests PR:

```bash
git push -u origin HEAD
gh pr create --title "Phase N: ..." --body "..."
```

PR body should include:
- Phase number and goal
- Checklist of completed PROJECT_PLAN_V2 tasks
- Test plan (`npm test`, manual MCP smoke test steps)

---

## What NOT to do

| Don't | Why |
|-------|-----|
| Re-introduce Postgres or Next.js | Removed intentionally |
| Split MCP into device + cloud again | Phase 1 goal is unification |
| Add Stripe / API credits | Out of scope |
| Large refactor unrelated to current phase | Keep PRs reviewable |
| Amend commits after failed hooks | Create new commit instead |
| Skip tests to "move faster" | Generator regressions are costly |

---

## Useful grep commands

```bash
# Find MCP tool registrations
rg "case '" src/mcp/

# Find cloud/auth leftovers
rg -i "api.key|apikey|drizzle|nextauth|postgres" src/ test/

# Find bundled data path resolution
rg "fx-modules|load-racks|FxModuleStore" src/

# Find stale monorepo paths
rg "packages/" --glob '!docs/**' --glob '!node_modules/**'
```

---

## File ownership by phase

| Phase | Primary files |
|-------|---------------|
| 0 | repo root, `docs/`, delete web app |
| 1 | `src/mcp/*`, `src/stores/*`, `test/mcp-*` |
| 2 | `package.json`, `README.md` |
| 3 | `docs/SKILL.md`, `.cursor/skills/`, `src/mcp/tools.ts` |
| 3.5 | `src/mcp/handlers*.ts`, validation, `upload_memory` schema, `docs/MCP Test Run 2.md` |
| 4A | `skills/rc505mk2/`, `plugin/`, pack scripts |
| 5 | GitHub Releases, marketplace assets |

---

## Getting unstuck

| Problem | Check |
|---------|-------|
| `FxModuleStore` can't find data | Run `npm run build`; verify `data/fx-modules/` at package root |
| MCP server exits immediately | Normal for stdio — must be launched by MCP client |
| Upload fails | Device in STORAGE mode? Run `detect_device` first |
| Tests fail after flatten | Update import paths from `packages/rc505mk2-lib/...` to relative |
| Template missing | Run `npm run build:template` |

Refer to [ARCHITECTURE.md](./ARCHITECTURE.md) for module layout and [LIBRARY.md](./LIBRARY.md) for API details.
