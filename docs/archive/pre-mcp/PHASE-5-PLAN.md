# Phase 5: Web UI Config Editors

> Implementation plan for schema-driven FX editors, rack composition, memory config editing,
> and preset browsing in `packages/web/`.
>
> **Depends on:** Phases 1–4 (all complete)
> **Created:** 2026-03-17

---

## Context

Phase 4 delivered the `packages/web/` Next.js 16 server app with:
- PostgreSQL (Neon) via Drizzle ORM — 7 tables with JSONB columns
- NextAuth v5 (GitHub + Google OAuth)
- Cloud MCP server (15 tools) at `/mcp`
- REST API routes for fx-modules, racks, memories, export
- Seed script for bundled public presets

The root app (`/`) has an existing static-export Next.js site with:
- Tailwind CSS v4 (custom dark theme, accent colors)
- shadcn/radix UI primitives (19 components in `src/components/ui/`)
- Framer Motion animations
- Existing components: `MemoryBuilderPanel`, `RackCard`, `RackModal`, `FilterBar`, `SlotPicker`
- Zustand stores for state management

Phase 5 builds the interactive editing and browsing UI in `packages/web/`.

---

## Architecture Decisions

### 1. UI Component Library
Reuse the same stack as the root app:
- **Tailwind CSS v4** with the existing custom theme tokens
- **shadcn/radix primitives** — copy `src/components/ui/` from root app
- **Framer Motion** for animations
- **Zustand** for editor state management
- **React Hook Form + Zod** for form validation (schemas from `@rc505mk2/lib`)

### 2. Schema-Driven Forms
All FX parameter forms are generated from `PARAM_MAP` + `TRANSFORM_META` at runtime.
Adding a new FX type or parameter requires zero UI code changes — only update the lib data.

### 3. Server Components + Client Islands
- List/browse pages use Server Components (direct DB access via repos)
- Editor forms are `'use client'` components with Zustand stores
- Server Actions for mutations (create/update/delete)

### 4. URL Structure
```
/presets/fx-modules                 # Browse FX modules
/presets/fx-modules/new             # Create new FX module
/presets/fx-modules/[id]            # View/edit FX module
/presets/racks                      # Browse racks
/presets/racks/new                  # Create new rack
/presets/racks/[id]                 # View/edit rack
/presets/memories                   # Browse memory configs
/presets/memories/new               # Create new memory config
/presets/memories/[id]              # View/edit memory config
/settings                          # User settings, API key management
```

---

## Implementation Steps

### Step 1: UI Foundation

Set up the shared UI layer in `packages/web/`.

**Files:**
```
packages/web/
├── src/
│   ├── components/
│   │   └── ui/           # Copy shadcn primitives from root app
│   ├── styles/
│   │   └── globals.css   # Tailwind v4 theme (port from root app)
│   └── app/
│       └── layout.tsx    # Update with global styles, auth session provider
```

**Tasks:**
- [ ] Copy shadcn/ui primitives needed: button, input, label, select, slider, switch, toggle, card, badge, tabs, dialog, sheet, dropdown-menu, tooltip, separator, scroll-area, command, popover
- [ ] Port Tailwind v4 theme tokens (colors, fonts, keyframes) from root `src/app/globals.css`
- [ ] Add `@tailwindcss/postcss` to web package
- [ ] Install client deps: `framer-motion`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`
- [ ] Create `cn()` utility (`src/lib/utils.ts`)
- [ ] Update root layout with global styles, dark theme, auth `SessionProvider`

### Step 2: FX Module Editor

The simplest editor — creates/edits a single FX module preset.

**Files:**
```
packages/web/src/
├── components/
│   └── editors/
│       ├── fx-module-form.tsx       # Schema-driven FX param form
│       ├── fx-param-field.tsx       # Individual param field (slider, dropdown, toggle)
│       ├── sequencer-panel.tsx      # 16-step sequencer editor (conditional)
│       └── metadata-fields.tsx      # Title, category, tags, context, usage, description
├── stores/
│   └── fx-module-store.ts           # Zustand store for editor state
├── lib/
│   └── param-fields.ts             # buildFxParamFields() — generates form config from PARAM_MAP + TRANSFORM_META
└── app/
    └── presets/
        └── fx-modules/
            ├── page.tsx             # Browse/list (Server Component)
            ├── new/
            │   └── page.tsx         # Create form
            └── [id]/
                └── page.tsx         # View/edit form
```

**Form generation logic:**
```typescript
// src/lib/param-fields.ts
import { PARAM_MAP, TRANSFORM_META } from '@rc505mk2/lib';

export function buildFxParamFields(effectName: string) {
  const paramDefs = PARAM_MAP[effectName];
  if (!paramDefs) return [];

  return Object.entries(paramDefs).map(([name, def]) => {
    const meta = TRANSFORM_META.get(def.transform);
    return {
      name,
      tag: def.tag,
      type: meta?.type ?? 'numeric',        // 'numeric' | 'enum'
      values: meta?.values,                  // for enums: ['HALL1','HALL2',...]
      range: meta?.range,                    // for numbers: { min: 0, max: 100 }
      description: meta?.description,
    };
  });
}
```

**UI flow:**
1. Select FX type from dropdown (all entries from `RC0_FX_NAME_LIST`, grouped by category)
2. Form renders parameter fields dynamically from `buildFxParamFields()`
3. Each field renders as: enum → `<Select>`, numeric → `<Slider>` + number input, on/off → `<Switch>`
4. Optional: toggle sequencer panel (only for FX types in `RC0_SEQ_FX_MAP`)
5. Add metadata: title, category, tags, context (ifx/tfx checkboxes), usage, description
6. Save → Zod validate via `FxModuleSchema` → POST `/api/presets/fx-modules`
7. Appears in user's module library

**Key principle:** The `fx-param-field.tsx` component reads the `type` from TRANSFORM_META and renders the appropriate input. No per-FX-type UI code exists.

### Step 3: Sequencer Panel

Conditional panel for FX types that support the 16-step sequencer.

**Behavior:**
- Only visible when the selected FX type has an entry in `RC0_SEQ_FX_MAP`
- Target selector dropdown (from `SEQ_TARGETS[seqFxName]`)
- 16 step value inputs — input type/range adapts to the selected target's value type
- Control params: SW (on/off), SYNC (on/off), RETRIG (on/off), SEQ RATE, SEQ MAX (1–16)
- Visual step grid layout (4×4 or 1×16)

**Data source:** `handleLookupFxParams()` already returns structured sequencer info with `targets[].stepValueType` — reuse that logic client-side via the same lib imports.

### Step 4: Rack Editor

Composes FX modules into a bank configuration with inheritance support.

**Files:**
```
packages/web/src/
├── components/
│   └── editors/
│       ├── rack-editor.tsx          # Main rack editor layout
│       ├── bank-panel.tsx           # Single bank (4 slots) with tabs
│       ├── slot-editor.tsx          # Per-slot: module picker or manual entry
│       ├── module-picker-dialog.tsx # Browse/search modules to assign
│       ├── override-indicator.tsx   # Visual diff for overridden params
│       └── rack-metadata.tsx        # Title, section, genres, tags, description
├── stores/
│   └── rack-store.ts                # Zustand store for rack editor state
└── app/
    └── presets/
        └── racks/
            ├── page.tsx             # Browse/list
            ├── new/
            │   └── page.tsx         # Create
            └── [id]/
                └── page.tsx         # View/edit
```

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ Rack: "Vocal Processing"                          │
│                                                   │
│  [Input FX] [Track FX]                  ← tabs    │
│  ┌──────────────────────────────────────────────┐ │
│  │ Bank [A] [B] [C] [D]                ← tabs  │ │
│  │                                              │ │
│  │  Slot A: [Gentle Comp ▼] (from module)       │ │
│  │    TYPE: NATURALCOMP (inherited)             │ │
│  │    DYNAMICS: -3 (overridden, was -6)  [↺]    │ │
│  │  Slot B: [Hall Wash ▼] (from module)         │ │
│  │    TIME: 3.0 (overridden, was 5.0)    [↺]    │ │
│  │  Slot C: (empty) [+ Add Module]              │ │
│  │  Slot D: (empty) [+ Add Module]              │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  [Save Rack]  [Export as Memory]                  │
└──────────────────────────────────────────────────┘
```

**Per-slot interactions:**
- **Browse modules:** Opens `module-picker-dialog.tsx` — lists user's + public FxModules, filtered by context (ifx/tfx) and optionally by effect type
- **Assign module:** Sets `fxModuleId`, populates params from module, clears overrides
- **Override param:** User edits an inherited value → added to `overrides[]`, displayed with accent color + revert button (`[↺]`)
- **Manual entry:** No module reference — user selects FX type and dials params directly (inline `fx-param-field.tsx` components)
- **Inheritance resolution:** Uses `resolveSlotParams()` and `computeOverrides()` from `@rc505mk2/lib`

### Step 5: Memory Config Editor

Extends the concept from `MemoryBuilderPanel` with full editing capabilities.

**Files:**
```
packages/web/src/
├── components/
│   └── editors/
│       ├── memory-editor.tsx        # Main memory config editor
│       ├── memory-fx-panel.tsx      # Input FX / Track FX section (reuses bank-panel)
│       ├── settings-panel.tsx       # Track, master, rec, play, rhythm settings
│       ├── settings-form.tsx        # Schema-driven settings form
│       └── preview-panel.tsx        # Read-only resolved values tree
├── stores/
│   └── memory-store.ts             # Zustand store for memory editor state
└── app/
    └── presets/
        └── memories/
            ├── page.tsx
            ├── new/
            │   └── page.tsx
            └── [id]/
                └── page.tsx
```

**Sections:**
1. **Slot number** — selector (1–99) with name field
2. **FX panels** — Input FX + Track FX, each with 4 banks × 4 slots (reuses `bank-panel.tsx` from rack editor, or assign a saved Rack via `sourceRackId`)
3. **Settings panels** — generated from Zod schemas:
   - Track settings (per track 1–5): level, pan, reverse, oneShot, FX on/off, start/stop mode
   - Master: tempo, delay/reverb levels
   - Rec/Play/Rhythm settings
4. **Preview panel** — read-only tree showing all resolved values
5. **Export actions** — Save to DB, download ZIP (RC0 files), upload to device (triggers device MCP)

### Step 6: Preset Browsers

Three browse/discover pages — one per config tier.

**Shared browser component:**
```
packages/web/src/
├── components/
│   └── browsers/
│       ├── preset-browser.tsx       # Generic filterable list with cards
│       ├── filter-sidebar.tsx       # Filter controls (effect, category, tags, etc.)
│       ├── preset-card.tsx          # Card display with actions
│       └── sort-controls.tsx        # Sort by newest/alphabetical/popular
```

**FX Module Browser** (`/presets/fx-modules`):
- Filter by: effect type, category, context (ifx/tfx), usage, tags
- Sort by: newest, alphabetical
- Scope: user's own + public modules
- Actions: view details, edit, clone, delete, assign to rack slot

**Rack Browser** (`/presets/racks`):
- Filter by: genre, FX types used, tags
- Sort by: newest, alphabetical
- Scope: user's own + public racks
- Actions: view details, edit, clone, delete, assign to memory bank

**Memory Config Browser** (`/presets/memories`):
- Filter by: genre, slot number range
- Sort by: newest, slot number
- Actions: view details, edit, clone, delete, download, upload to device

All browsers use Server Components for the initial data fetch and stream results via `Suspense`.

### Step 7: User Settings & API Key Management

**Files:**
```
packages/web/src/app/
└── settings/
    ├── page.tsx                     # User profile, preferences
    └── api-keys/
        └── page.tsx                 # MCP API key management
```

**API Key UI:**
- Generate new API key → display once → store SHA-256 hash in `mcp_api_keys`
- List existing keys (label, created date, last used)
- Revoke keys
- Copy-paste config snippet for Claude Desktop / Claude Code MCP setup

**API routes needed:**
```
POST   /api/settings/api-keys       # Generate new key
GET    /api/settings/api-keys       # List keys (without hash)
DELETE /api/settings/api-keys/[id]  # Revoke key
```

### Step 8: Navigation & Layout

**Files:**
```
packages/web/src/
├── components/
│   ├── nav/
│   │   ├── sidebar.tsx              # Left sidebar navigation
│   │   ├── user-menu.tsx            # Auth state, sign in/out, avatar
│   │   └── breadcrumbs.tsx          # Page context breadcrumbs
│   └── layout/
│       └── app-shell.tsx            # Sidebar + main content area
└── app/
    ├── layout.tsx                   # Root: SessionProvider, theme, fonts
    └── presets/
        └── layout.tsx               # Preset section: sidebar + breadcrumbs
```

**Navigation structure:**
```
Presets
  ├── FX Modules
  ├── Racks
  └── Memory Configs
Settings
  ├── Profile
  └── API Keys
```

---

## Shared Concepts

### Param Field Rendering Rules

| TRANSFORM_META type | UI Component | Details |
|---------------------|-------------|---------|
| `numeric` | `<Slider>` + number input | Uses `range.min` / `range.max` |
| `enum` | `<Select>` dropdown | Options from `values[]` |
| `onOff` (enum `ON`/`OFF`) | `<Switch>` toggle | Special case of enum |
| `note` (enum with note values) | `<Select>` with note labels | e.g., `1/4`, `1/8`, `1/16` |

### Inheritance Visual Language

| State | Display |
|-------|---------|
| Inherited (from module) | Normal text, muted color |
| Overridden | Accent color (purple), bold, revert button `[↺]` |
| Manual (no module) | Normal text, no indicator |

### Clone Flow
All three preset types support cloning:
1. Fetch original preset
2. Strip `id`, `userId`, `createdAt`, `updatedAt`
3. Prepend "Copy of " to title/name
4. Open in editor as new preset

---

## Dependencies to Install

```
# Client UI
framer-motion
zustand
react-hook-form
@hookform/resolvers
class-variance-authority
clsx
tailwind-merge
lucide-react
@radix-ui/react-slot
@radix-ui/react-select
@radix-ui/react-slider
@radix-ui/react-switch
@radix-ui/react-toggle
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-tabs
@radix-ui/react-tooltip
@radix-ui/react-popover
@radix-ui/react-scroll-area
@radix-ui/react-separator
@radix-ui/react-collapsible
@radix-ui/react-label

# PostCSS
@tailwindcss/postcss (dev)
```

---

## File Summary

| Location | Action | Count |
|----------|--------|-------|
| `src/components/editors/` | Create | ~12 files |
| `src/components/browsers/` | Create | ~4 files |
| `src/components/nav/` | Create | ~3 files |
| `src/components/layout/` | Create | ~1 file |
| `src/components/ui/` | Copy from root app | ~19 files |
| `src/stores/` | Create | ~3 files |
| `src/lib/param-fields.ts` | Create | 1 file |
| `src/lib/utils.ts` | Create | 1 file |
| `src/styles/globals.css` | Create | 1 file |
| `src/app/presets/` (pages) | Create | ~10 files |
| `src/app/settings/` (pages) | Create | ~2 files |
| `src/app/api/settings/` (routes) | Create | ~2 files |
| `src/app/layout.tsx` | Modify | 1 file |
| **Total** | | **~60 files** |

---

## Verification Checklist

- [ ] `npm run build` in `packages/web/` succeeds
- [ ] FX Module Editor renders correct fields for every FX type in `RC0_FX_NAME_LIST`
- [ ] Sequencer panel appears only for FX types in `RC0_SEQ_FX_MAP`
- [ ] Step value inputs match selected target's value type/range
- [ ] Rack editor inherits params from assigned module
- [ ] Override indicator shows for changed params, revert works
- [ ] Memory editor can assign a Rack or compose from individual modules
- [ ] Settings forms validate against Zod schemas
- [ ] All three browsers filter and sort correctly
- [ ] Clone flow works at all three levels
- [ ] API key generation shows key once, stores hash
- [ ] Auth required for create/update/delete operations
- [ ] Existing lib tests still pass (376 tests)
