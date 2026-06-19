# Inspire Me — Feature Spec

> **Status:** Spec only — slated for **Phase 6** (after marketplace / Phase 5).  
> **Problem:** Creatives stall at the inspiration step. Browsing 43 racks is a catalog, not a creative director.  
> **Solution:** Server-backed inspiration with a conversational skill wrapper — curated picks, guided Q&A, and session blueprints.

**Related:** [PROJECT_PLAN_V2.md](./PROJECT_PLAN_V2.md#phase-6--creative-enhancements-inspire-me), [SKILL.md](./SKILL.md), [TEST_PROMPTS.md](./TEST_PROMPTS.md)

---

## Goals

| Goal | Metric |
|------|--------|
| Reduce “blank page” friction | User gets a usable starting point in ≤ 2 turns |
| Guarantee quality | No uniformly random picks from full library |
| Stay local-first | No network; scoring runs in MCP server |
| Complement Adapt/Build | Inspire **suggests**; user still adapts/builds/uploads after |
| Work for non-technical users | Claude Desktop starter prompt + plain language |

**Non-goals (Phase 6):**

- AI-generated novel rack JSON from scratch (use Build mode for that)
- Per-genre slash skills (`/rc505-dnb`) — genre stays a filter inside inspire
- Cloud sync of inspiration history

---

## Existing assets to leverage

Already in `src/data/racks.json` but **not exposed via MCP today**:

| Asset | Count | Use in inspire |
|-------|-------|----------------|
| Bundled rack presets | 43 | Curated pools, scored options |
| Genre templates | 5 | Full 5-track session blueprints |
| Sections / tags / genres | 20 / 37 / 29 | Wizard filters, compatibility |
| Rack `tips` + `performanceTip` | per rack / per template | “Try this” copy in responses |

Genre templates today:

- Hip Hop / Boom Bap Looping Session
- EDM / House Build & Drop
- Dubstep / Bass Music
- Modern Rock / Alternative
- Synthwave / Retrowave

---

## Three modes (one feature family)

All modes share the same quality rules and response shape. User intent picks the mode; agent may infer from phrasing.

### 1. Instant — “surprise me”

**Triggers:** *Inspire me.* · *Surprise me.* · *Give me something to try tonight.* · *I'm stuck.*

**Behavior:**

- Return **one** curated pick OR a **starter pack** (2–3 complementary racks mapped to suggested slots).
- No clarifying questions unless filters are contradictory.
- Include “Roll again” as explicit next action.

**Server:** `inspire_me { mode: "random", scope?: "single_rack" | "starter_pack" }`

**Target:** 1 tool call, ≤ 3s handler time.

---

### 2. Options — “help me choose”

**Triggers:** *Inspire me with a few options.* · *Not sure what vibe — show me some ideas.*

**Behavior:**

- Return **2–3 scored options**, each with:
  - Title + rack ID(s)
  - One-line pitch (“safe for first gig”, “more DJ energy”)
  - Suggested first move (“Record 2 bars beatbox on Track 1…”)
- User picks A/B/C or asks to roll again.

**Server:** `inspire_me { mode: "options", ...filters }`

**Target:** 1 tool call; agent presents options in prose.

---

### 3. Wizard — “walk me through it”

**Triggers:** *Inspire me — ask me a few questions.* · *Help me figure out what to load.*

**Behavior:**

- **3–5 questions max**, prefer multiple-choice.
- Early exit if answers already imply a genre template.
- Final step returns one recommendation OR options (mode 2).

**Server:** `inspire_wizard { step, answers? }` — stateless steps keyed by `step` + cumulative `answers` (no server session store required for v1).

**Target:** ≤ 5 wizard turns + 1 final `inspire_me` or embedded result.

---

### 4. Session — “build me a set” (stretch in 6B)

**Triggers:** *Inspire a lo-fi hip hop looping session.* · *Full 5-track layout for EDM.*

**Behavior:**

- Map to nearest **genre template** OR synthesize track-role → rack mapping.
- Output 5-track blueprint + performance tip from template.
- Optional: suggest memory slots 1–5 for upload.

**Server:** `inspire_session { genre?, vibe?, template_id? }`

**Depends on:** `list_genre_templates` + rack-to-role scoring.

---

## Architecture: server + skill

| Layer | Responsibility |
|-------|----------------|
| **MCP server** | Curation pools, scoring, genre templates, variety/history, structured JSON responses |
| **`/rc505-inspire` skill** | When to call inspire vs browse; question budget; offer upload/adapt/build as follow-ups |
| **Plugin manifest** | Starter prompt: *“Inspire me — something fun to try on my 505 tonight”* |
| **Umbrella skill** | Link to inspire for “stuck / don't know / surprise” phrasing |

**Principle:** Server guarantees **what** is good; skill guarantees **how** the conversation feels.

---

## MCP tools (proposed)

### Phase 6A — minimum viable

| Tool | Purpose |
|------|---------|
| `list_genre_templates` | Expose bundled session blueprints (read-only) |
| `inspire_me` | Random, options, or filtered instant picks |

### Phase 6B — full wizard + sessions

| Tool | Purpose |
|------|---------|
| `inspire_wizard` | Multi-step Q&A; returns `question` or `result` |
| `inspire_session` | 5-track session map + rack IDs + performance tip |

### `inspire_me` input schema (draft)

```typescript
{
  mode: "random" | "options",           // required
  scope?: "single_rack" | "starter_pack", // default single_rack
  // optional filters — all omitted = curated surprise
  input_type?: "mic" | "inst" | "mixed",
  vibe?: "chill" | "polished" | "aggressive" | "performance",
  genre?: string,                       // fuzzy match against rack genres
  section?: string,                     // e.g. vocal-creative, tfx-performance
  exclude_rack_ids?: string[],          // "roll again" — client passes prior picks
}
```

### `inspire_me` response shape (draft)

```typescript
{
  mode: "random" | "options",
  picks: Array<{
    id: string,                         // stable pick id for "I'll take B"
    title: string,
    pitch: string,                      // 1–2 sentences
    rack_ids: string[],                 // one or more
    slot_suggestions?: Array<{ slot_number: number, rack_id: string, label?: string }>,
    try_this: string,                   // performance prompt
    template_id?: string,               // if anchored to genre template
  }>,
  next_actions: string[],               // e.g. upload_memory, get_rack_preset, inspire_me roll again
}
```

### `inspire_wizard` step flow (draft)

| Step | `step` | Question | Answer keys |
|------|--------|----------|-------------|
| 1 | `input` | What are you mainly looping? | `vocals` \| `beatbox` \| `guitar` \| `keys` \| `mixed` |
| 2 | `energy` | What energy? | `chill` \| `polished` \| `aggressive` \| `performance` |
| 3 | `scope` | How much do you want? | `one_rack` \| `starter_pack` \| `full_session` |
| 4 | `upload` | Load to device now? | `yes` \| `no` \| `later` |
| done | — | — | Returns `inspire_me`-shaped result |

Wizard is **stateless**: client sends `{ step: 2, answers: { input: "vocals", energy: "chill" } }`.

---

## Quality & curation

### Curated pool (default random source)

Include racks that pass all:

- [ ] Valid TFX special-FX placement (or no special FX)
- [ ] Has at least one `tip` OR is in a named section (not orphan)
- [ ] Not user-only / experimental test racks

Optional explicit `inspireTier: 1 | 2` in rack metadata later; **Phase 6A** can use a hardcoded allowlist in `src/data/inspire-pools.json`.

### Starter pack compatibility

When `scope: "starter_pack"`, pick 2–3 racks where:

- Genres overlap OR template roles complement (drums + vocals + performance TFX)
- No duplicate primary role (two vocal-warm variants)
- At least one rack has `tfx` or performance section if `vibe: "performance"`

### Variety

- Persist last N rack IDs in `~/.rc505mk2/inspire-history.json` (cap 20).
- `exclude_rack_ids` from client OR server reads history for `mode: "random"`.
- “Roll again” never repeats last pick unless pool exhausted.

### Scoring (options mode)

Weighted score from filters:

| Signal | Weight |
|--------|--------|
| Genre exact match | +3 |
| Tag match | +2 |
| Section match | +2 |
| Vibe → section map (chill → vocal-ambient, aggressive → vocal-aggressive) | +2 |
| Has performance tips | +1 |
| In curated tier-1 pool | +1 |

Return top 3 distinct scores; tie-break with random.

---

## Skill: `/rc505-inspire`

**Directory:** `skills/rc505-inspire/`  
**Phase:** 6A (basic) / 6B (wizard)

### Workflow rules

1. On “stuck / inspire / surprise / don't know” → call `inspire_me` or `inspire_wizard` **first** — do not `list_rack_presets` without filters.
2. Present picks conversationally; preserve pick `id` so user can say “B” or “the beat mangler one”.
3. After selection → offer **one** follow-up: upload, inspect (`get_rack_preset`), adapt, or roll again.
4. If user picks full session → `inspire_session` or genre template + per-track rack mapping.
5. Hardware rules still apply on upload — defer to umbrella skill.

### Example transcript

```
User: Inspire me — I'm stuck before a gig tonight.

Agent: [inspire_me { mode: "options", vibe: "performance", scope: "starter_pack" }]

Here are three starter paths:

A) **Beat Mangler + Warm Vocal** — glitch-ready TFX plus a polished vocal chain. Good if you want energy.
B) **Clean Beatbox Foundation** — minimal, punchy; build up from a solid drum loop.
C) **DJ Filter Sweep session** — breakdown tools first; great for EDM transitions.

Which one speaks to you — or want me to roll again?

User: A

Agent: [get_rack_preset tfx-beat-mangle] — Want me to load these to slots 1 and 2?
```

---

## Plugin & distribution

| Deliverable | Phase |
|-------------|-------|
| MCP tools in server | 6A–6B |
| `skills/rc505-inspire/SKILL.md` | 6A |
| Bundle skill in `.mcpb` + `pack:plugin` | 6A |
| Manifest starter prompt `inspire-me` | 6A |
| `docs/TEST_PROMPTS.md` § Inspire | 6A |
| `npx skills add --skill rc505-inspire` docs | 6A |

---

## Implementation phases

### 6A — Foundation (ship first)

| Task | Notes |
|------|-------|
| `list_genre_templates` handler + tool | Read from `racks.json` |
| `src/data/inspire-pools.json` | Tier-1 allowlist + vibe→section map |
| `inspire_me` handler (random + options) | Scoring + history file |
| Tests: pool never empty, no repeat, options count = 3 |
| `skills/rc505-inspire/SKILL.md` | Thin workflow |
| Plugin manifest prompt | Consumer path |
| Update `UNIFIED_MCP_TOOLS.md` | Tool docs |

**Exit criteria:** *“Inspire me”* returns 1–3 quality picks in one call; genre templates listable.

**Branch:** `phase-6/inspire`

### 6B — Wizard & sessions

| Task | Notes |
|------|-------|
| `inspire_wizard` stateless steps | See step table above |
| `inspire_session` + template→rack resolver | Map track roles to nearest rack IDs |
| Starter pack → multi-slot upload suggestion | Links to upload skill |
| MCP Test Run 5 — inspire regression doc | Tool-call budget |
| Expand `TEST_PROMPTS.md` inspire section | |

**Exit criteria:** Wizard completes in ≤ 5 questions; full session returns 5-track map with rack IDs.

### 6C — Polish (optional)

| Task | Notes |
|------|-------|
| `inspireTier` on rack metadata | Replace hardcoded allowlist |
| CLI: `rc505mk2 inspire` | Terminal users |
| “Creative combos” from legacy guide data | If recovered from archive |

---

## Success metrics

| Metric | Target |
|--------|--------|
| Tool calls: “inspire me” (instant) | 1 |
| Tool calls: wizard end-to-end | ≤ 6 |
| Empty result rate | 0% (always fallback picks) |
| Repeat on “roll again” | 0 consecutive duplicates |
| User proceeds to upload/adapt after inspire | Qualitative — log in test runs |

---

## Open questions

1. **One memory vs multi-slot:** RC-505 memory = 5 tracks in one slot. Starter pack suggests **multiple memory slots** (slot 1 = drums rack, slot 2 = vocal rack) — confirm this matches user mental model.
2. **Session upload:** Phase 6B upload of 5-track *session* may mean five `upload_memory` calls — document clearly; no batch upload tool yet.
3. **User rack pool:** Include user-created racks in inspire pools? Default **bundled only**; optional `include_user: true`.
4. **Icon/branding:** “Inspire” as playful tone in plugin copy — align with primary non-technical audience.

---

## References

- Genre template shape: `src/data/racks.json` → `genreTemplates[]`
- Adapt vs Build: [SKILL.md](./SKILL.md#adapt-vs-build-pick-one-per-request)
- Slash skills pattern: [PROJECT_PLAN_V2.md](./PROJECT_PLAN_V2.md#slash-skills-plan)
- Test prompt library: [TEST_PROMPTS.md](./TEST_PROMPTS.md)
