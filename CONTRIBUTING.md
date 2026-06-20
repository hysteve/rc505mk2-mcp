# Contributing

Thanks for helping improve RC-505mk2 Assistant. This project ships a local MCP server, bundled FX presets, and a Claude Desktop `.mcpb` bundle.

## Quick start

```bash
git clone https://github.com/hysteve/rc505mk2-mcp.git
cd rc505mk2-mcp
npm install
npm test
npm run build
npx rc505mk2 doctor
```

Node **18+** required. See [docs/CONCEPTS.md](./docs/CONCEPTS.md) for domain terminology and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for code layout.

## Pull requests

1. Branch from `main`.
2. Make focused changes with tests where behavior changes.
3. Run locally before opening a PR:

   ```bash
   npm test
   npm run build
   ```

4. Open a PR against `main`. CI runs `npm ci`, `npm test`, and `npm run build`.

### Merge strategy: squash

**Use squash merge** when merging PRs to `main`. Release-please reads each merged PR as one commit, so the **squash commit title** should follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use | Release impact |
|--------|-------------|----------------|
| `feat:` | New user-facing capability | Minor bump |
| `fix:` | Bug fix | Patch bump |
| `feat!:` or `BREAKING CHANGE:` footer | Breaking change | Major bump |
| `docs:`, `chore:`, `test:`, `refactor:` | Internal-only work | No release by itself |

**Examples of good squash titles:**

- `feat: add reverse-reverb swell rack preset`
- `fix: coerce TFX slot params before upload`
- `docs: clarify Adapt vs Build in CONCEPTS`

Put additional detail in the PR description; release-please uses the squash commit title (and optional footers) for the changelog.

## Releases

Releases are automated with [release-please](https://github.com/googleapis/release-please). There is **no npm publish** in CI — users download the `.mcpb` from [GitHub Releases](https://github.com/hysteve/rc505mk2-mcp/releases/latest).

### How a release ships

1. Merge feature/fix PRs to `main` with conventional squash titles.
2. Release-please opens or updates a **Release PR** (e.g. `chore(main): release 0.4.1`) that bumps `package.json`, `package-lock.json`, and `CHANGELOG.md`.
3. Review that PR — edit `CHANGELOG.md` if anything needs polish.
4. Before merging the Release PR, check out that branch locally and run:

   ```bash
   npm run prep:release
   ```

   This validates git state, changelog, test, build, and a local `.mcpb` pack. It does **not** create tags.

   Quick validation on any branch (no git/changelog checks, no pack):

   ```bash
   npm run prep:release:check
   ```

5. **Squash-merge the Release PR** to `main`.
6. The [release-please workflow](./.github/workflows/release-please.yml) tags `vX.Y.Z`, creates the GitHub Release from `CHANGELOG.md`, builds `releases/rc505mk2-vX.Y.Z.mcpb`, and uploads it.

### One-time bootstrap (maintainers)

If `v0.4.0` is not already tagged on GitHub, create it once so release-please knows where history starts:

```bash
git tag -a v0.4.0 -m "v0.4.0"
git push origin v0.4.0
```

### Version source of truth

Only **`package.json`** is bumped by release-please. The MCP server reads that at runtime; `npm run pack:mcpb` stamps the bundle manifest from the same file.

### Optional: CI on Release PRs

Release-please PRs created with the default `GITHUB_TOKEN` may not re-trigger other workflows. If you want CI checks on Release PRs before merge, add a [Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) as `RELEASE_PLEASE_TOKEN` and set it on the release-please workflow. Otherwise, run `npm run prep:release` locally before merging.

Also enable **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests** so release-please can open Release PRs.

### Fixing release notes after merge

If a squash title was wrong, edit the merged PR body and add:

```
BEGIN_COMMIT_OVERRIDE
feat: corrected summary for the release
END_COMMIT_OVERRIDE
```

Then re-run release-please (or wait for the next push to `main`). Requires squash-merge history.

Force a specific version with an empty commit:

```bash
git commit --allow-empty -m "chore: release 0.5.0" -m "Release-As: 0.5.0"
```

## What not to commit

- `releases/`, `.mcpb-staging/`, `dist/`, `node_modules/`
- `.env`, credentials, local IDE config (`.vscode/`, `.cursor/`, etc.)
- Experimental `skills/` (see `.gitignore`)

## Manual testing

Copy-paste MCP prompts by workflow: [docs/TEST_PROMPTS.md](./docs/TEST_PROMPTS.md)

Hardware upload requires an RC-505mk2 in USB Storage mode (`MENU → USB → STORAGE → CONNECT`).

## Questions

Open a [GitHub Issue](https://github.com/hysteve/rc505mk2-mcp/issues) for bugs and feature ideas.
