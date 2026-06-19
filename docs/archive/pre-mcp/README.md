# Pre-MCP archive (guide site → RC0 engine era)

> Historical documentation recovered from git commit **`c1959df`** (2026-03-16) — the last snapshot before the Phase 0 MCP-only overhaul (`8a865e1`).  
> These files are **read-only reference**. Active docs live in [`../`](../) and the root [README](../../README.md).

This folder preserves the research and planning trail behind the current MCP assistant: RC0 reverse-engineering, parameter verification, library design, guide-site product specs, and the cloud-platform path that was later dropped.

---

## RC0 & parameter research (highest value)

| File | Source | What it is |
|------|--------|------------|
| [RC0-RESEARCH-FINDINGS.md](./RC0-RESEARCH-FINDINGS.md) | `c1959df` | Lab notebook — USB layout, A/B file pairs, XML structure, community tools, session progress |
| [RC505mk2-Parameter-Reference.txt](./RC505mk2-Parameter-Reference.txt) | `c1959df` | Text lookup extracted from Roland parameter PDF — RC0 tag → device param |
| [RC-505mk2_Parameter_eng04_W.txt](./RC-505mk2_Parameter_eng04_W.txt) | `c1959df` | Raw Roland official parameter document (source material) |
| [FX-Parameter-Verification-Checklist.txt](./FX-Parameter-Verification-Checklist.txt) | `c1959df` | Manual hardware verification — device screen vs XML for every FX param |
| [RC0-sequencer-params.md](./RC0-sequencer-params.md) | `c1959df` | Which FX params expose sequencers (`fxSeqTarget`) |
| [RC505-Preset-Generator.md](./RC505-Preset-Generator.md) | `c1959df` | Early feasibility notes — RC0 is XML, map `racks.json` → device files |

**Live descendants:** `src/params/`, `src/generator/`, `src/parser/`, `src/data/fx-reference.json`, `test/fixtures/default.rc0`

---

## Guide site & product

| File | Source | What it is |
|------|--------|------------|
| [RC505mk2-Guide-Project-Summary.md](./RC505mk2-Guide-Project-Summary.md) | `c1959df` | Master continuation doc — vision, build status, **technical reference**, errors v1.0→v1.1, preset generator, marketing, file inventory |
| [RC-505mk2 Guide - Monetization Wiring Playbook.md](./RC-505mk2%20Guide%20-%20Monetization%20Wiring%20Playbook.md) | `c1959df` | Gumroad, AdSense, affiliates, email capture wiring for rc505guide.com |
| [Enhancements.md](./Enhancements.md) | `0adff16` | Guide UX/feature backlog (tiles, modals, content calendar, artist breakdowns) |

**Also archived at parent level:** [../VISION.md](../VISION.md)

---

## Library (`@rc505mk2/lib`)

| File | Source | What it is |
|------|--------|------------|
| [LIBRARY-v1-README.md](./LIBRARY-v1-README.md) | `c1959df` | Original package README before flatten to repo root |

**Superseded by:** [../../LIBRARY.md](../../LIBRARY.md)  
**Deep architecture (cloud era):** [../CONFIG-SYSTEM-PLAN.md](../CONFIG-SYSTEM-PLAN.md)

---

## Web UI specs (never shipped as MCP)

| File | Source | What it is |
|------|--------|------------|
| [MEMORY-BUILDER-PLAN.md](./MEMORY-BUILDER-PLAN.md) | `c1959df` | Memory Builder feature — bank/slot model, export flow, sprints |
| [MEMORY-BUILDER-COMPONENTS.md](./MEMORY-BUILDER-COMPONENTS.md) | `c1959df` | React component tree, props, interfaces |
| [MEMORY-BUILDER-WIREFRAMES.md](./MEMORY-BUILDER-WIREFRAMES.md) | `c1959df` | ASCII wireframes for all UI states |
| [PHASE-5-PLAN.md](./PHASE-5-PLAN.md) | `c1959df` | Cloud web app — schema-driven editors, Drizzle/Neon, NextAuth, HTTP MCP |

---

## Timeline (how this became the MCP assistant)

```
rc505guide.com (browse racks manually)
    → RC0 research + param-map/transforms (LIBRARY)
    → Memory Builder UI specs
    → Cloud platform plan (CONFIG-SYSTEM-PLAN, PHASE-5)
    → Phase 0: drop web/cloud → local MCP only (8a865e1)
    → Phase 4: .mcpb Claude Desktop extension (today)
```

---

## Recover more from git

```bash
# List all markdown at the pre-overhaul snapshot
git ls-tree -r --name-only c1959df | rg '\.(md|txt)$'

# Extract any file
git show c1959df:path/to/file > docs/archive/pre-mcp/filename
```

Other useful commits:

| Commit | Era |
|--------|-----|
| `bffb915` | Initial React guide site |
| `0981e0e` | First `rc505mk2-lib` + MCP server |
| `ea44091` | CONFIG-SYSTEM-PLAN expansion (cloud CRUD) |
| `8a865e1` | Phase 0 MCP-only restructure |
| `a4469b8` | Current beta docs (HEAD) |
