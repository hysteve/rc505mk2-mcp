# Memory Builder — Feature Plan

> Planning document for the RC-505mk2 Memory Builder UI feature.
> Each sprint is a self-contained unit of work that can be completed in a single chat session.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`MEMORY-BUILDER-WIREFRAMES.md`](./MEMORY-BUILDER-WIREFRAMES.md) | ASCII wireframes for all UI states |
| [`MEMORY-BUILDER-COMPONENTS.md`](./MEMORY-BUILDER-COMPONENTS.md) | Component tree, props, and interfaces |

---

## Overview

The Memory Builder is a persistent UI panel where users visually assemble a full memory configuration by placing rack presets into bank slots, then exporting a device-ready RC0 file pair. It bridges the gap between browsing individual rack presets and producing a complete, multi-bank memory file for the RC-505mk2.

### Core Concepts

- A **Memory** (slots 1-99) holds two FX sections: **Input FX** and **Track FX**
- Each section has **4 Banks** (A-D), each bank has **4 Slots** (A-D)
- A bank is the active FX chain on the device — the user switches between banks live
- A **Rack** preset from the site maps to one bank's worth of slots (input + track)
- The Memory Builder lets users fill multiple banks from different rack presets
- Export produces `MEMORYXXXA.RC0` + `MEMORYXXXB.RC0` for direct device loading

### Key UX Principles

1. **Unified bank view** — Users think in terms of complete racks, not separate Input/Track FX sections. Show both in one bank card.
2. **Progressive disclosure** — Start simple (bank overview), reveal complexity on demand (slot editing).
3. **At-a-glance status** — Collapsed panel should still communicate useful state.
4. **Drag-and-drop everywhere** — Modern music software expectation (Ableton, Splice).
5. **Preview before commit** — Show what will happen before applying changes.

### Data Flow

```
User browses site → clicks "Add to Memory" on a RackCard
                            ↓
                   MemoryBuilder panel updates
                   (rack fills the next empty bank)
                            ↓
              User reviews banks, adjusts if needed
                            ↓
                   Clicks "Export Memory"
                            ↓
         rackToMemoryConfig() → memoryConfigToRc0Pair()
                            ↓
              ZIP download: MEMORYXXXA.RC0 + MEMORYXXXB.RC0 + readme.txt
```

### Technical Foundation (Already Built)

| Module | Purpose |
|--------|---------|
| `src/types/memory-config.ts` | MemoryConfig schema (banks, slots, FX, settings) |
| `src/lib/RC0_FX_NAMES.ts` | Canonical FX names, context-aware index resolution |
| `src/lib/rc0-generator.ts` | `rackToMemoryConfig()`, `memoryConfigToRc0Pair()` |
| `src/lib/rc0-parser.ts` | `parseRC0PairActive()` for importing existing files |
| `src/lib/rc0-download.ts` | ZIP generation and browser download trigger |

---

## Sprint 1 — Memory Builder Panel (MVP)

**Goal:** Persistent sidebar panel showing 4 unified bank containers. Users can assign racks to banks and export a memory file.

> 📐 See wireframes: [`MEMORY-BUILDER-WIREFRAMES.md#sprint-1`](./MEMORY-BUILDER-WIREFRAMES.md#sprint-1--mvp-panel)

### Task 1.1 — MemoryBuilder State & Context

Create a React context to hold the builder state, persisted to localStorage.

**File:** `src/context/MemoryBuilderContext.tsx`

**State shape:**
```ts
interface MemoryBuilderBank {
  rackId: string | null;
  rackTitle: string | null;
  // Derived at render time from rack data:
  // - inputFxCount: number of Input FX slots filled
  // - trackFxCount: number of Track FX slots filled
  // - genreColor: primary genre color for visual coding
}

interface MemoryBuilderState {
  slotNumber: number;           // 1-99 (default 50)
  memoryName: string;           // User-editable, max 12 chars, defaults to first rack title
  banks: {
    A: MemoryBuilderBank;
    B: MemoryBuilderBank;
    C: MemoryBuilderBank;
    D: MemoryBuilderBank;
  };
  collapsed: boolean;           // Panel collapsed state (persisted)
  targetBank: 'A'|'B'|'C'|'D' | null;  // Currently selected bank for next assignment
}
```

**Actions:**
- `assignRack(bank: 'A'|'B'|'C'|'D', rack: Rack)` — place a rack in a bank
- `assignRackToNextEmpty(rack: Rack)` — auto-assign to first empty bank (A→B→C→D)
- `removeRack(bank: 'A'|'B'|'C'|'D')` — clear a bank
- `clearAll()` — reset all banks and memory name
- `setSlotNumber(n: number)` — update memory slot number (clamped 1-99)
- `setMemoryName(name: string)` — update memory name (max 12 chars)
- `setTargetBank(bank: 'A'|'B'|'C'|'D' | null)` — set bank as target for next add
- `toggleCollapsed()` — toggle panel collapsed state
- `exportMemory()` — trigger download

**Persistence:** Save to `localStorage` key `rc505_memory_builder` on every state change. Restore on mount.

**Implementation notes:**
- Use `useReducer` for clean state transitions
- Export a `useMemoryBuilder()` hook
- Context needs access to `racks.json` data to resolve rack IDs back to full Rack objects
- Provide a `getRackData(rackId: string): Rack | null` helper from context

### Task 1.2 — MemoryBuilderPanel Component

The visual panel that lives in the sidebar (desktop) or as a floating bottom card (mobile).

**File:** `src/components/MemoryBuilderPanel.tsx`

> 📐 See detailed wireframes in [`MEMORY-BUILDER-WIREFRAMES.md#desktop-panel`](./MEMORY-BUILDER-WIREFRAMES.md#desktop-expanded-panel)

**Key design decisions:**

1. **Unified bank cards** — Each bank shows BOTH Input and Track FX status in one card. Users don't think in separate FX sections.

2. **Rich collapsed state** — When collapsed, show inline bank status (not just "2/4 banks"):
   ```
   🧠 Memory · Slot 50                    [▲]
   [●●○○] A:Perc B:Vocal C:— D:—
   ```

3. **Memory name field** — Above slot number, editable, defaults to first rack's title. This becomes the 12-char preset name on device.

4. **Bank card content:**
   - Bank letter (A/B/C/D) with slot color coding
   - Dual progress indicators: `■■■■ Input ■■·· Track`
   - Rack title (truncated) or "Drop rack" for empty
   - Border color matches rack's primary genre

5. **Empty bank affordance:**
   - Dashed border
   - "Drop rack" text (implies actionability)
   - Subtle pulse animation when any "Add to Memory" button is hovered

6. **Hover on filled bank** — Tooltip showing FX chain summary:
   ```
   Perc Acoustic
   ├─ Input: DYNAMICS → DYNAMICS → EQ → REVERB
   └─ Track: LPF
   ```

**Styling (use existing CSS variables):**
- Background: `var(--surface2)`
- Border: `var(--border)`
- Bank colors: Use existing slot color system (`.slot-label.a` etc.)
- Filled banks: subtle gradient, solid border with genre color
- Empty banks: dashed border, recessed background (`var(--surface)`)
- Export button: Use `promo-cta-primary` gradient style (most prominent)

### Task 1.3 — "Add to Memory" Button on RackCard

Add an "Add to Memory" action button alongside the existing download/like/share buttons.

**Changes to:** `src/components/RackCard.tsx`, `src/components/RackModal.tsx`

**Button:** `+🧠` icon (distinct from download 💾)

**Placement:** In `.rack-actions` row, between share (📤) and download (💾)

**Behavior:**
1. On click: Call `assignRackToNextEmpty(rack)` from context
2. If all banks full: Show toast "All banks full — remove one first"
3. On success: 
   - Pulse animation on the filled bank in MemoryBuilderPanel
   - Brief "Added to Bank X" feedback near the button

**Hover interaction:**
- When hovering the button, MemoryBuilderPanel should show which bank will receive it
- Empty target bank gets a subtle pulse/glow to show "this is where it's going"

**Special case:** If rack has special TFX (BEAT_SCATTER, BEAT_REPEAT, BEAT_SHIFT, VINYL_FLICK), show info tooltip: "Contains special Track FX — must be in Slot A"

### Task 1.4 — Export Flow (Memory Download)

Wire up the "Export Memory" button in the panel to generate and download the RC0 file pair.

**File:** `src/lib/rc0-download.ts` (extend existing)

**New function:**
```ts
export async function downloadMemoryFromBuilder(
  state: MemoryBuilderState,
  racks: Rack[],
): Promise<void>
```

**Steps:**
1. For each filled bank (A-D), look up full Rack by `rackId`
2. Build composite `MemoryConfig`:
   - Use `state.memoryName` as the preset name
   - Each rack's inputFx → corresponding bank of `inputFx`
   - Each rack's trackFx → corresponding bank of `trackFx`
   - Master settings: use first rack that has tempo, or default
3. Call `memoryConfigToRc0Pair()` to generate XML
4. Package ZIP: `MEMORY{NNN}A.RC0`, `MEMORY{NNN}B.RC0`, `readme.txt`
5. Download via `downloadBlob()`

**Edge cases:**
- No banks filled → Export button disabled, tooltip "Add at least one rack"
- Partial fill → Empty banks use template defaults (existing behavior)
- Multiple racks have tempo → Use first non-null tempo found (A→D priority)

### Task 1.5 — Integration & Sidebar Placement

Wire the MemoryBuilderPanel into the page layout.

**Changes to:**
- `src/app/page-client.tsx` — wrap with `MemoryBuilderProvider`
- `src/components/Sidebar.tsx` — add `MemoryBuilderPanel` as FIRST widget (above product CTA)
- `src/app/globals.css` — add styles (see CSS section below)

**Sidebar positioning:**
- Sticky at top of sidebar content
- Collapsible with state persisted to localStorage
- When collapsed, stays sticky and shows compact status bar

**CSS additions (globals.css):**
```css
/* MEMORY BUILDER PANEL */
.memory-builder { /* panel container */ }
.memory-builder-collapsed { /* collapsed bar */ }
.memory-builder-header { /* header with title and controls */ }
.memory-builder-banks { /* 2×2 grid container */ }
.memory-bank { /* individual bank card */ }
.memory-bank.filled { /* has rack assigned */ }
.memory-bank.empty { /* no rack */ }
.memory-bank.target { /* selected as next target */ }
.memory-bank-slots { /* dual slot indicators */ }
.memory-builder-actions { /* export/clear buttons */ }
```

---

## Sprint 2 — Bank-Specific Download & Single-Rack Flow

**Goal:** Allow downloading a single rack as a specific bank assignment, and improve the existing download flow.

> 📐 See wireframes: [`MEMORY-BUILDER-WIREFRAMES.md#sprint-2`](./MEMORY-BUILDER-WIREFRAMES.md#sprint-2--enhanced-slotpicker)

### Task 2.1 — Enhanced SlotPicker with Bank Selection

Extend SlotPicker to include bank selection with current state awareness.

**Changes to:** `src/components/SlotPicker.tsx`

**Key additions:**

1. **Bank selector buttons** (A/B/C/D toggle group)
2. **Current state indicator** — If Memory Builder has racks assigned, show:
   ```
   Place in Bank:
   [A:Perc✓] [B:—] [C:—] [D:—]
            ↑ replacing existing
   ```
3. **Preview section** — Show what FX will be configured:
   ```
   This will configure Bank A with:
   Input FX: DYNAMICS → EQ → REVERB
   Track FX: DELAY → CHORUS
   ```

**Props update:**
```ts
interface SlotPickerProps {
  onConfirm: (slot: number, bank: 'A'|'B'|'C'|'D') => void;
  onCancel: () => void;
  rack: Rack;  // NEW: needed for preview
  memoryBuilderState?: MemoryBuilderState;  // NEW: to show current bank status
}
```

### Task 2.2 — MemoryConfig JSON Export

Add secondary export option for our portable JSON format.

**Changes to:** `src/components/MemoryBuilderPanel.tsx`

**UI:** Small link/button below primary export: "Export as JSON"

**Behavior:**
1. Build `MemoryConfig` same as RC0 export
2. Download as `memory-{slot}-{name}.json`
3. This JSON can be re-imported in Sprint 3

### Task 2.3 — RackCard "Add to Memory" UX Polish

**Enhancements:**

1. **Hover preview connection:**
   - On `+🧠` button hover, MemoryBuilderPanel highlights target bank
   - CSS class `.memory-bank.preview-target` with pulse animation

2. **Special TFX warning:**
   - If rack contains BEAT_SCATTER/REPEAT/SHIFT/VINYL_FLICK
   - Show info icon with tooltip explaining Slot A requirement

3. **Add animation:**
   - On successful add, brief scale+glow on the target bank
   - Use existing `animate-scale-in` keyframe, extend with glow

---

## Sprint 3 — Reverse Import (RC0 → Memory Builder)

**Goal:** Allow users to import existing MEMORY files from their device and view/edit them in the builder.

> 📐 See wireframes: [`MEMORY-BUILDER-WIREFRAMES.md#sprint-3`](./MEMORY-BUILDER-WIREFRAMES.md#sprint-3--import-flow)

### Task 3.1 — Drag-and-Drop File Import

**Primary method:** Drag RC0 files directly onto the Memory Builder panel.

**Changes to:** `src/components/MemoryBuilderPanel.tsx`

**Implementation:**
1. Add `onDragOver`, `onDrop` handlers to panel
2. Accept `.RC0` files (validate extension)
3. Visual feedback: panel border changes on drag-over
4. Parse dropped files immediately

**Secondary method:** "Import" button in panel header opens file picker.

**File:** `src/lib/rc0-import.ts`
```ts
export async function importMemoryFiles(
  fileA: File,
  fileB: File,
): Promise<MemoryConfig>

// Also support single-file import (will warn about missing pair)
export async function importSingleMemoryFile(
  file: File,
): Promise<{ config: Partial<MemoryConfig>; warnings: string[] }>
```

### Task 3.2 — Slot Number Auto-Detection

Parse slot number from filename before import.

**Regex:** `/MEMORY(\d{3})[AB]\.RC0/i`

**Behavior:**
- Auto-populate `slotNumber` in builder state
- If both files provided, validate they match (MEMORY042A + MEMORY042B)
- Warn if slot numbers don't match

### Task 3.3 — Import Validation Modal

Show a preview/confirmation modal after parsing, before applying.

**File:** `src/components/ImportPreviewModal.tsx`

**Content:**
```
┌─────────────────────────────────────────┐
│ Import: MEMORY042                       │
│                                         │
│ Found 3 active banks:                   │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐                    │
│ │A●│ │B●│ │C○│ │D●│                    │
│ └──┘ └──┘ └──┘ └──┘                    │
│                                         │
│ Bank A: DYNAMICS → EQ → REVERB (Input)  │
│         DELAY → CHORUS (Track)          │
│ Bank B: ...                             │
│ Bank D: ...                             │
│                                         │
│ ⚠ 1 unrecognized FX: "CUSTOM_123"       │
│                                         │
│ [ Import ] [ Cancel ]                   │
└─────────────────────────────────────────┘
```

**Warnings to surface:**
- Unrecognized FX types
- Parameter values outside expected ranges
- Missing pair file (imported from single file)

---

## Sprint 4 — Full Visual Builder

**Goal:** Expand the builder into a full visual editor with drag-and-drop, per-slot editing, and settings controls.

> 📐 See wireframes: [`MEMORY-BUILDER-WIREFRAMES.md#sprint-4`](./MEMORY-BUILDER-WIREFRAMES.md#sprint-4--expanded-builder)

### Task 4.1 — Expanded Builder View

Full-screen modal triggered from sidebar panel ("Expand" button or click on panel header).

**File:** `src/components/MemoryBuilderExpanded.tsx`

**Layout principles:**
1. **Progressive disclosure** — Start with bank overview, expand to slots, then parameters
2. **Click-to-expand** — Bank card → Slot view → Parameter editor
3. **Don't overwhelm** — Hide settings panel in collapsible section

**Sections:**
1. Header: Memory name, slot number, close button
2. Bank grid (4 banks, horizontal on desktop)
3. Selected bank detail (slots visible when a bank is selected)
4. Settings panel (collapsible)
5. Actions: Export RC0, Export JSON, Clear All

### Task 4.2 — Drag-and-Drop Rack Assignment

**Dependencies:** Consider `@dnd-kit/core` (lightweight, accessible)

**Draggable sources:**
- RackCards in main content area
- Compact rack cards in builder's inline search results

**Drop targets:**
- Empty bank slots
- Filled bank slots (shows "Replace" indicator)

**Additional drag operations:**
- Reorder banks (drag bank A to bank C position)
- Move slot between banks (drag Slot A from Bank A to Bank B)

**Visual feedback:**
- Dragging: card follows cursor with slight opacity reduction
- Over valid target: target glows with accent color
- Over filled target: show "Replace [existing rack]" indicator

### Task 4.3 — Per-Slot FX Editing

**File:** `src/components/FxSlotEditor.tsx`

**Trigger:** Click on individual slot within expanded bank view

**UI (modal or slide-out panel):**
```
┌─────────────────────────────────────┐
│ Bank A · Slot A                 [×] │
├─────────────────────────────────────┤
│ FX Type: [ DYNAMICS        ▼]      │
│          🔍 Search FX...            │
├─────────────────────────────────────┤
│ Enabled: [●] On                     │
├─────────────────────────────────────┤
│ Parameters                          │
│ ┌─────────────────────────────────┐ │
│ │ Presets: [Natural] [Punchy] [Heavy] │
│ ├─────────────────────────────────┤ │
│ │ TYPE:     [ NATURALCOMP  ▼]     │ │
│ │ DYNAMICS: [========●===] 8      │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [ Apply ] [ Reset ] [ Cancel ]      │
└─────────────────────────────────────┘
```

**FX Type Selector:**
- Searchable dropdown (50+ FX types is too many to scroll)
- Grouped by category: Filters, Pitch, Dynamics, Delay, Modulation, etc.
- Recently used FX at top
- Special TFX types (BEAT_SCATTER etc.) marked with badge, only in Slot A of Track FX

**Parameter presets:**
- Analyze existing rack data for common parameter clusters
- Offer quick-apply buttons for typical configurations
- "Reset to rack default" button

### Task 4.4 — Settings Panel

**File:** `src/components/MemorySettingsPanel.tsx`

**Collapsible section** in expanded builder.

**Controls:**

1. **Master tempo** (40.0-300.0 BPM)
   - Number input with +/- buttons
   - Optional: pulsing indicator for visual feedback

2. **Per-track settings** (collapsible per track, 1-5):
   - Level: slider 0-200
   - Pan: slider with L-C-R labels (maps to 0-100)
   - Reverse: toggle
   - One Shot: toggle
   - FX On/Off: toggle
   - Start Mode: dropdown (IMMEDIATE/FADE)
   - Stop Mode: dropdown (IMMEDIATE/FADE/LOOP)

### Task 4.5 — Quick-Fill from Search

Inline rack search within expanded builder.

**Implementation:**
- Search input at top of expanded builder
- Reuses existing search logic from `SearchBar.tsx`
- Results as compact cards (title, genre badge, FX summary)
- Click result → opens bank selector popover → assigns to chosen bank

---

## Sprint 5 — Persistence, Sharing & Polish

**Goal:** Save/load builder configs, share via URL, and polish the UX.

> 📐 See wireframes: [`MEMORY-BUILDER-WIREFRAMES.md#sprint-5`](./MEMORY-BUILDER-WIREFRAMES.md#sprint-5--sharing--polish)

### Task 5.1 — Save Builder Configurations

Multiple named configurations saved locally.

**State addition:**
```ts
interface SavedBuilder {
  id: string;           // UUID
  name: string;         // User-provided name
  savedAt: string;      // ISO timestamp
  state: MemoryBuilderState;
}
```

**localStorage key:** `rc505_saved_builders` (array, max 10)

**UI:**
- "Save" button → prompt for name → saves current state
- "Load" dropdown → list of saved configs
- Swipe-to-delete or explicit delete button per saved config

### Task 5.2 — URL-Based Sharing

Encode minimal builder state in URL for sharing.

**Format:** `#builder=eyJ...` (base64 JSON)

**Encoded payload (minimal):**
```ts
interface ShareableBuilderState {
  s: number;            // slotNumber
  n: string;            // memoryName
  a: string | null;     // bank A rackId
  b: string | null;     // bank B rackId
  c: string | null;     // bank C rackId
  d: string | null;     // bank D rackId
}
```

**On page load:**
1. Check for `#builder=` hash
2. Decode and validate
3. Populate builder state (racks resolved from `racks.json`)
4. Clear hash from URL (optional, prevents re-trigger on refresh)

**Share button:**
1. Generate URL with current state
2. Copy to clipboard
3. Show "Link copied!" feedback

**Future consideration:** OG meta tags for social preview (requires SSR or redirect service)

### Task 5.3 — Guided Walkthrough

First-time user onboarding for the builder feature.

**Trigger:** First click on `+🧠` button or first panel expand

**localStorage flag:** `rc505_builder_onboarded`

**Steps:**
1. "Browse presets and click +🧠 to add to your memory"
2. "Fill up to 4 banks — switch between them live on your RC-505"
3. "Set your memory slot number (50-99 recommended)"
4. "Export and copy to your device via USB"

**Implementation:**
- Dismissible overlay/tooltip sequence
- "Skip" and "Next" buttons
- Progress dots
- "Don't show again" checkbox on last step

### Task 5.4 — Genre-Based Auto-Fill

Quick-fill from genre templates.

**Data source:** `genreTemplates` in `racks.json`

**UI:** Suggestion chips in builder panel header area:
```
Quick fill: [Hip Hop] [EDM] [Acoustic] [+]
```

**Behavior:**
1. Click genre chip → show preview modal:
   ```
   Quick Fill: Hip Hop
   
   This will assign:
   Bank A: Perc Acoustic
   Bank B: Lo-Fi Vocal
   Bank C: Sub Bass Generator
   Bank D: Tape Saturation
   
   [ Apply ] [ Cancel ]
   ```
2. On apply, replace all banks and set appropriate memory name

### Task 5.5 — Mobile Builder Experience

**Bottom sheet pattern:**
- Collapsed: sticky bar at bottom, above MobileBar
- Expanded: slides up, max 70% viewport height
- Gesture: swipe up to expand, swipe down to collapse

**Bank navigation:**
- Swipeable tabs instead of 2×2 grid
- Tab indicators: `[A] [B] [C] [D]` with fill status dots

**Full-screen editor:**
- "Expand" opens full-screen modal (not just larger sheet)
- Optimized touch targets (min 44px)
- Simplified parameter editing (larger sliders, bigger buttons)

**Z-index management:**
- Collapsed bar: 201 (above MobileBar at 200)
- Expanded sheet: 210
- Full-screen modal: 10001 (above everything except critical modals)

---

## File Manifest

| Sprint | New Files | Modified Files |
|--------|-----------|----------------|
| 1 | `src/context/MemoryBuilderContext.tsx`, `src/components/MemoryBuilderPanel.tsx` | `page-client.tsx`, `Sidebar.tsx`, `RackCard.tsx`, `RackModal.tsx`, `rc0-download.ts`, `globals.css` |
| 2 | — | `SlotPicker.tsx`, `MemoryBuilderPanel.tsx`, `rc0-download.ts` |
| 3 | `src/lib/rc0-import.ts`, `src/components/ImportPreviewModal.tsx` | `MemoryBuilderPanel.tsx` |
| 4 | `src/components/MemoryBuilderExpanded.tsx`, `src/components/FxSlotEditor.tsx`, `src/components/MemorySettingsPanel.tsx` | `MemoryBuilderPanel.tsx`, `globals.css` |
| 5 | — | `MemoryBuilderContext.tsx`, `MemoryBuilderPanel.tsx`, `page-client.tsx`, `globals.css` |

---

## Dependencies & Considerations

### Package Dependencies

| Sprint | Package | Purpose | Required? |
|--------|---------|---------|-----------|
| 1-3 | None | Uses existing React, localStorage, fflate | — |
| 4 | `@dnd-kit/core` | Drag-and-drop | Recommended |
| 4 | `@dnd-kit/sortable` | Reorderable lists | Optional |

### Validation Rules (Enforce in UI)

- **Special TFX constraint:** BEAT_SCATTER, BEAT_REPEAT, BEAT_SHIFT, VINYL_FLICK only allowed in Slot A of Track FX, one per bank. Validation exists in `collectFxEdits()`.
- **Memory name:** Max 12 ASCII characters (device limit)
- **Slot number:** 1-99, recommend 50-99 to preserve factory presets
- **Parameter ranges:** Defined in `RC0_FX_PARAM_MAP`

### Browser Support Notes

- **Drag-and-drop files:** Works in all modern browsers
- **localStorage:** Available everywhere, 5MB limit (plenty for our use)
- **URL hash sharing:** Works everywhere, no SSR needed
- **Clipboard API:** Requires HTTPS in some browsers (fallback: select+copy prompt)

### CSS Class Naming Convention

Use BEM-ish pattern consistent with existing codebase:
```
.memory-builder
.memory-builder-header
.memory-builder-banks
.memory-bank
.memory-bank--filled
.memory-bank--empty
.memory-bank--target
.memory-bank__slots
.memory-bank__title
```

---

## Animation Specifications

| Trigger | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Rack added to bank | Scale 1.05 + glow | 300ms | ease-out |
| Bank hover (empty, while +🧠 hovered) | Pulse border | 1s loop | ease-in-out |
| Panel expand/collapse | Height + fade | 250ms | ease-out |
| Export success | Checkmark + fade | 400ms | ease-out |
| Import drop zone active | Border glow | — | — |

Use existing keyframes where possible (`scale-in`, `pulse-glow`, `fade-in`).

---

## Testing Checklist

### Sprint 1
- [ ] Assign rack to each bank (A, B, C, D)
- [ ] Auto-assign fills banks in order
- [ ] Remove individual banks
- [ ] Clear all works
- [ ] Export with 1, 2, 3, 4 banks filled
- [ ] Export with 0 banks (should be disabled)
- [ ] Slot number persists across page reload
- [ ] Collapsed state persists

### Sprint 2
- [ ] Bank selection in SlotPicker works
- [ ] Bank selection shows current Memory Builder state
- [ ] JSON export downloads valid JSON
- [ ] JSON can be parsed back

### Sprint 3
- [ ] Drag-drop RC0 files works
- [ ] File picker works
- [ ] Slot number auto-detected from filename
- [ ] Validation warnings display correctly
- [ ] Import populates builder state

### Sprint 4
- [ ] Expanded view opens/closes
- [ ] Drag-drop racks to banks works
- [ ] Slot editing saves changes
- [ ] FX type dropdown searchable
- [ ] Settings changes persist to export

### Sprint 5
- [ ] Save/load named configs
- [ ] URL sharing generates valid link
- [ ] Shared URL populates builder on load
- [ ] Walkthrough triggers on first use
- [ ] Genre auto-fill works
- [ ] Mobile bottom sheet gestures work
