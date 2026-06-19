# Memory Builder — Wireframes

> ASCII wireframes for all Memory Builder UI states.
> Reference document for [`MEMORY-BUILDER-PLAN.md`](./MEMORY-BUILDER-PLAN.md)

---

## Sprint 1 — MVP Panel

### Desktop Collapsed Panel

When collapsed, show useful at-a-glance status:

```
┌─────────────────────────────────────────┐
│ 🧠 Memory · Slot 50               [▼]  │
│ [●●○○] A:Perc  B:Vocal  C:—  D:—       │
└─────────────────────────────────────────┘
```

**Legend:**
- `●` = filled bank
- `○` = empty bank
- `[▼]` = expand button

### Desktop Expanded Panel

Full panel in sidebar (300px width):

```
┌─────────────────────────────────────────┐
│ 🧠 Memory Builder                  [▲]  │
├─────────────────────────────────────────┤
│ Name: [ Beatbox Set 1       ]           │
│ Slot: [−] [ 50 ] [+]                    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────┐ ┌─────────────────┐│
│  │ A               │ │ B               ││
│  │ ■■■■ In  ■■·· Tr│ │ ■■■· In  ■··· Tr││
│  │ Perc Acoustic   │ │ Lo-Fi Vocal     ││
│  │ 🎵 Hip Hop      │ │ 🎵 Lo-Fi        ││
│  └─────────────────┘ └─────────────────┘│
│                                         │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ┐ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ┐│
│  │ C               │ │ D               ││
│  │ ···· In  ···· Tr│ │ ···· In  ···· Tr││
│  │   Drop rack     │ │   Drop rack     ││
│  │      +          │ │      +          ││
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ┘ └ ─ ─ ─ ─ ─ ─ ─ ─ ┘│
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │       Export Memory             │    │
│  └─────────────────────────────────┘    │
│  Clear All                              │
└─────────────────────────────────────────┘
```

**Key elements:**
- `■` = filled FX slot
- `·` = empty FX slot
- `In` = Input FX (4 slots)
- `Tr` = Track FX (4 slots)
- Dashed border = empty bank
- Solid border = filled bank
- `+` icon in empty bank suggests adding

### Bank Card States

**Filled bank:**
```
┌─────────────────────┐
│ A                   │  ← Bank letter with accent color
│ ■■■■ In  ■■·· Tr    │  ← Slot fill indicators
│ Perc Acoustic       │  ← Rack title (truncated)
│ 🎵 Hip Hop          │  ← Primary genre badge
└─────────────────────┘
     ↑ Solid border with genre color
```

**Empty bank:**
```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ C                   │
│ ···· In  ···· Tr    │
│   Drop rack         │
│      +              │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
     ↑ Dashed border
```

**Target bank (selected for next add):**
```
╔═════════════════════╗
║ C              ★    ║  ← Star indicates target
║ ···· In  ···· Tr    ║
║   Drop rack         ║
║      +              ║
╚═════════════════════╝
     ↑ Glowing accent border
```

### Bank Hover Tooltip

When hovering a filled bank:

```
                    ┌────────────────────────────┐
                    │ Perc Acoustic              │
                    │ ├─ Input: DYNAMICS →       │
                    │ │         DYNAMICS → EQ →  │
                    │ │         REVERB           │
                    │ └─ Track: LPF              │
                    │                            │
                    │ [ Remove ]                 │
                    └────────────────────────────┘
```

### RackCard with Add Button

```
┌───────────────────────────────────────────────────────────┐
│ 🥁 Tight Acoustic Percussion Rack                         │
│                                                           │
│ [❤️ 24] [📤 15] [+🧠] [💾] [⛶]       🎵 Hip Hop  Acoustic │
│                  ↑                                        │
│            Add to Memory button                           │
├───────────────────────────────────────────────────────────┤
│ Designed for hand percussion, cajon, or tapping...        │
│ ...                                                       │
└───────────────────────────────────────────────────────────┘
```

### Mobile Collapsed Bar

Sticky at bottom of viewport:

```
┌─────────────────────────────────────────────────────────┐
│ 🧠 Memory (2/4)                                    [▲]  │
└─────────────────────────────────────────────────────────┘
```

### Mobile Expanded Sheet

Slides up from bottom:

```
┌─────────────────────────────────────────────────────────┐
│ ═══════════════════  (drag handle)                      │
│                                                         │
│ 🧠 Memory Builder                                  [▼]  │
│                                                         │
│ Name: [ Beatbox Set 1       ]    Slot: [50]             │
│                                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ A       │ │ B       │ │ C       │ │ D       │        │
│ │ ●●●●●●  │ │ ●●●○○○  │ │ ○○○○○○  │ │ ○○○○○○  │        │
│ │ Perc    │ │ Vocal   │ │ Empty   │ │ Empty   │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │               Export Memory                        │   │
│ └───────────────────────────────────────────────────┘   │
│ Clear All                                               │
└─────────────────────────────────────────────────────────┘
```

---

## Sprint 2 — Enhanced SlotPicker

### SlotPicker with Bank Selection

```
┌─────────────────────────────────────────────┐
│ Download Preset                         [×] │
├─────────────────────────────────────────────┤
│                                             │
│ Memory Slot: [−] [ 50 ] [+]                 │
│                                             │
│ Place in Bank:                              │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │  A  │ │  B  │ │  C  │ │  D  │            │
│ │ ███ │ │     │ │     │ │     │  ← A selected
│ └─────┘ └─────┘ └─────┘ └─────┘            │
│                                             │
│ This will configure Bank A with:            │
│ ┌─────────────────────────────────────────┐ │
│ │ Input FX: DYNAMICS → DYNAMICS → EQ →    │ │
│ │           REVERB                         │ │
│ │ Track FX: LPF                            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌───────────────────┐ ┌───────────────────┐ │
│ │     Download      │ │      Cancel       │ │
│ └───────────────────┘ └───────────────────┘ │
└─────────────────────────────────────────────┘
```

### SlotPicker with Memory Builder Context

When Memory Builder already has assignments:

```
┌─────────────────────────────────────────────┐
│ Download Preset                         [×] │
├─────────────────────────────────────────────┤
│                                             │
│ Memory Slot: [−] [ 50 ] [+]                 │
│                                             │
│ Place in Bank:                              │
│ ┌─────────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │ A: Perc │ │  B  │ │  C  │ │  D  │        │
│ │  ✓      │ │ ███ │ │     │ │     │        │
│ └─────────┘ └─────┘ └─────┘ └─────┘        │
│         ↑                                   │
│   Shows existing rack, selecting replaces   │
│                                             │
│ This will configure Bank B with:            │
│ ┌─────────────────────────────────────────┐ │
│ │ Input FX: PITCH_SHIFT → FILTER → DELAY  │ │
│ │ Track FX: CHORUS                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌───────────────────┐ ┌───────────────────┐ │
│ │     Download      │ │      Cancel       │ │
│ └───────────────────┘ └───────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Sprint 3 — Import Flow

### Drag-Drop Zone Active

When dragging files over the panel:

```
╔═════════════════════════════════════════════╗
║                                             ║
║          ┌───────────────────────┐          ║
║          │                       │          ║
║          │    📂 Drop RC0 files  │          ║
║          │    to import memory   │          ║
║          │                       │          ║
║          └───────────────────────┘          ║
║                                             ║
╚═════════════════════════════════════════════╝
      ↑ Glowing border, dimmed content
```

### Import Preview Modal

After parsing dropped/selected files:

```
┌─────────────────────────────────────────────────────┐
│ Import Memory                                   [×] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📂 MEMORY042A.RC0 + MEMORY042B.RC0                  │
│ Detected slot: 42                                   │
│                                                     │
│ Found 3 active banks:                               │
│                                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │
│ │  A   │ │  B   │ │  C   │ │  D   │                │
│ │  ●   │ │  ●   │ │  ○   │ │  ●   │                │
│ │active│ │active│ │empty │ │active│                │
│ └──────┘ └──────┘ └──────┘ └──────┘                │
│                                                     │
│ Bank A:                                             │
│   Input: DYNAMICS → EQ → REVERB                     │
│   Track: DELAY → CHORUS                             │
│                                                     │
│ Bank B:                                             │
│   Input: FILTER → PITCH_SHIFT                       │
│   Track: (none)                                     │
│                                                     │
│ Bank D:                                             │
│   Input: PREAMP                                     │
│   Track: LOOPER                                     │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ⚠ Warning: Unknown FX type "CUSTOM_FX_123"      │ │
│ │   This effect will be preserved but not editable│ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌────────────────────┐ ┌────────────────────┐       │
│ │      Import        │ │       Cancel       │       │
│ └────────────────────┘ └────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

---

## Sprint 4 — Expanded Builder

### Full-Screen Expanded View

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🧠 Memory Builder                                                        [×] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Name: [ Beatbox Performance Set    ]       Slot: [−] [ 50 ] [+]              │
│                                                                              │
│ 🔍 [ Search racks to add...                                           ]     │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐                          │
│  │ Bank A               │  │ Bank B               │                          │
│  │ ══════════════════   │  │ ══════════════════   │                          │
│  │                      │  │                      │                          │
│  │ ┌────┐┌────┐┌────┐┌────┐ │  │ ┌────┐┌────┐┌────┐┌────┐ │                          │
│  │ │ A  ││ B  ││ C  ││ D  │ │  │ │ A  ││ B  ││ C  ││ D  │ │                          │
│  │ │DYN ││DYN ││ EQ ││REV │ │  │ │FLT ││PIT ││ -- ││ -- │ │                          │
│  │ └────┘└────┘└────┘└────┘ │  │ └────┘└────┘└────┘└────┘ │                          │
│  │ Input FX                │  │ Input FX                │                          │
│  │                      │  │                      │                          │
│  │ ┌────┐┌────┐┌────┐┌────┐ │  │ ┌────┐┌────┐┌────┐┌────┐ │                          │
│  │ │ A  ││ B  ││ C  ││ D  │ │  │ │ A  ││ B  ││ C  ││ D  │ │                          │
│  │ │LPF ││ -- ││ -- ││ -- │ │  │ │CHR ││ -- ││ -- ││ -- │ │                          │
│  │ └────┘└────┘└────┘└────┘ │  │ └────┘└────┘└────┘└────┘ │                          │
│  │ Track FX                │  │ Track FX                │                          │
│  │                      │  │                      │                          │
│  │ Perc Acoustic          │  │ Lo-Fi Vocal            │                          │
│  │ 🎵 Hip Hop              │  │ 🎵 Lo-Fi                │                          │
│  │ [ Remove ]              │  │ [ Remove ]              │                          │
│  └──────────────────────┘  └──────────────────────┘                          │
│                                                                              │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐                          │
│  │ Bank C               │  │ Bank D               │                          │
│  │                      │  │                      │                          │
│  │                      │  │                      │                          │
│  │    Drop rack here    │  │    Drop rack here    │                          │
│  │         +            │  │         +            │                          │
│  │                      │  │                      │                          │
│  │                      │  │                      │                          │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘                          │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ ▶ Settings                                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│ │   Export RC0    │  │   Export JSON   │  │    Clear All    │                │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Settings Panel (Expanded)

```
├──────────────────────────────────────────────────────────────────────────────┤
│ ▼ Settings                                                                   │
│                                                                              │
│ Master Tempo: [−] [ 120.0 ] [+] BPM                                          │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Track 1                                                            [▼]  │ │
│ ├──────────────────────────────────────────────────────────────────────────┤ │
│ │ Level: [================●=======] 100                                    │ │
│ │ Pan:   [========●===============] C                                      │ │
│ │ Reverse: [ ] Off    One-Shot: [ ] Off    FX: [●] On                      │ │
│ │ Start: [ IMMEDIATE ▼]    Stop: [ IMMEDIATE ▼]                            │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ▶ Track 2                                                                    │
│ ▶ Track 3                                                                    │
│ ▶ Track 4                                                                    │
│ ▶ Track 5                                                                    │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
```

### FX Slot Editor (Modal)

Click on a slot to edit:

```
┌─────────────────────────────────────────────────────────┐
│ Bank A · Slot A                                     [×] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ FX Type:                                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ DYNAMICS                                         ▼  │ │
│ └─────────────────────────────────────────────────────┘ │
│ 🔍 Search: [ Filter FX types...                       ] │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ★ Recently Used                                     │ │
│ │   DYNAMICS                                          │ │
│ │   REVERB                                            │ │
│ │   EQ                                                │ │
│ │─────────────────────────────────────────────────────│ │
│ │ Dynamics                                            │ │
│ │   DYNAMICS                                          │ │
│ │   LIMITER                                           │ │
│ │ Filters                                             │ │
│ │   LPF                                               │ │
│ │   HPF                                               │ │
│ │   ...                                               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Enabled: [●] On                                         │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Parameters                                          │ │
│ │                                                     │ │
│ │ Presets: [ Natural ] [ Punchy ] [ Heavy ]           │ │
│ │                                                     │ │
│ │ TYPE:                                               │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ NATURALCOMP                                  ▼  │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │                                                     │ │
│ │ DYNAMICS:                                           │ │
│ │ [==========●=================] 8                    │ │
│ │                                                     │ │
│ │ (Additional parameters based on FX type)            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│ │    Apply    │ │    Reset    │ │   Cancel    │         │
│ └─────────────┘ └─────────────┘ └─────────────┘         │
└─────────────────────────────────────────────────────────┘
```

### Inline Search Results

When using search in expanded builder:

```
│ 🔍 [ vocal                                               ]     │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 🎤 Lo-Fi Vocal             🎵 Lo-Fi                      │   │
│ │ Input: FILTER → DISTORTION  Track: CHORUS                │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ 🎤 Autotune Vocal          🎵 Pop                        │   │
│ │ Input: PITCH_SHIFT         Track: REVERB                 │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ 🎤 Robot Voice             🎵 Electronic                 │   │
│ │ Input: VOCODER             Track: DELAY                  │   │
│ └──────────────────────────────────────────────────────────┘   │
│   ↳ Click to add to selected bank                              │
```

---

## Sprint 5 — Sharing & Polish

### Saved Configurations Dropdown

```
┌─────────────────────────────────────────┐
│ 🧠 Memory Builder                  [▲]  │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Load saved... ▼                     │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ★ Beatbox Live Set                  │ │
│ │   Saved Feb 15, 2026                │ │
│ │                              [🗑️]   │ │
│ ├─────────────────────────────────────┤ │
│ │ ★ Guitar Practice                   │ │
│ │   Saved Feb 10, 2026                │ │
│ │                              [🗑️]   │ │
│ ├─────────────────────────────────────┤ │
│ │ ★ EDM Performance                   │ │
│ │   Saved Feb 8, 2026                 │ │
│ │                              [🗑️]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
```

### Genre Quick-Fill Chips

```
├─────────────────────────────────────────┤
│ Quick fill:                             │
│ [Hip Hop] [EDM] [Acoustic] [Rock] [+]   │
│                                         │
```

### Genre Quick-Fill Preview Modal

```
┌─────────────────────────────────────────────┐
│ Quick Fill: Hip Hop                     [×] │
├─────────────────────────────────────────────┤
│                                             │
│ This will configure:                        │
│                                             │
│ Bank A: Perc Acoustic                       │
│   Input: DYNAMICS → DYNAMICS → EQ → REVERB  │
│   Track: LPF                                │
│                                             │
│ Bank B: Lo-Fi Vocal                         │
│   Input: FILTER → DISTORTION                │
│   Track: CHORUS                             │
│                                             │
│ Bank C: Sub Bass Generator                  │
│   Input: PITCH_SHIFT → FILTER               │
│   Track: LIMITER                            │
│                                             │
│ Bank D: Tape Saturation                     │
│   Input: DISTORTION → EQ                    │
│   Track: (none)                             │
│                                             │
│ ⚠ This will replace your current banks     │
│                                             │
│ ┌────────────────────┐ ┌────────────────────┐│
│ │       Apply        │ │       Cancel       ││
│ └────────────────────┘ └────────────────────┘│
└─────────────────────────────────────────────┘
```

### First-Time Walkthrough

Step-by-step overlay:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         ┌─────────────────────────────┐                     │
│                         │ Welcome to Memory Builder   │                     │
│                         │                             │                     │
│                         │ Step 1 of 4                 │                     │
│                         │ ● ○ ○ ○                     │                     │
│                         │                             │                     │
│                         │ Browse presets and click    │                     │
│                         │ the +🧠 button to add       │                     │
│                         │ them to your memory.        │                     │
│                         │                             │                     │
│                         │ Each memory holds 4 banks   │                     │
│                         │ (A-D) that you switch       │                     │
│                         │ between live on your        │                     │
│                         │ RC-505mk2.                  │                     │
│                         │                             │                     │
│                         │ [Skip]           [Next →]   │                     │
│                         │                             │                     │
│                         │ [ ] Don't show again        │                     │
│                         └─────────────────────────────┘                     │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────┐      │
│    │ 🥁 Tight Acoustic Percussion                        [+🧠] ←────────────│
│    │ ...                                                  ↑          │      │
│    └─────────────────────────────────────────────────────────────────┘      │
│                                                     Arrow pointing here     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Full-Screen Editor

```
┌─────────────────────────────────────────────────────────┐
│ ← Memory Builder                              [ Done ]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Name: [ Beatbox Set 1       ]                           │
│ Slot: [−] [ 50 ] [+]                                    │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │    [A]       [B]       [C]       [D]                │ │
│ │    ●●●       ●●○       ○○○       ○○○                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                     │ │
│ │                   Bank A                            │ │
│ │                                                     │ │
│ │    ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │ │
│ │    │   A    │  │   B    │  │   C    │  │   D    │   │ │
│ │    │  DYN   │  │  DYN   │  │   EQ   │  │  REV   │   │ │
│ │    └────────┘  └────────┘  └────────┘  └────────┘   │ │
│ │    Input FX                                         │ │
│ │                                                     │ │
│ │    ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │ │
│ │    │   A    │  │   B    │  │   C    │  │   D    │   │ │
│ │    │  LPF   │  │   --   │  │   --   │  │   --   │   │ │
│ │    └────────┘  └────────┘  └────────┘  └────────┘   │ │
│ │    Track FX                                         │ │
│ │                                                     │ │
│ │    Perc Acoustic                                    │ │
│ │    🎵 Hip Hop                                        │ │
│ │                                                     │ │
│ │    [ Remove Bank ]                                  │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│              ← Swipe to change bank →                   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ▶ Settings                                              │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │                    Export RC0                       │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Interaction States

### Button States

**Add to Memory button:**
```
Normal:   [+🧠]         — var(--text2), var(--border)
Hover:    [+🧠]         — var(--accent), var(--accent) border
Active:   [+🧠]         — scale(0.95)
Disabled: [+🧠]         — opacity 0.3
Success:  [✓🧠]         — briefly shows checkmark, var(--accent4)
```

### Bank Card States

```
Empty:           Dashed border, recessed bg
Empty + Target:  Solid accent border, pulse animation
Empty + Hover:   Slight lift, border color change
Filled:          Solid border (genre color), elevated shadow
Filled + Hover:  Show tooltip
Drop Target:     Glow effect, "Replace X?" text if filled
```

### Panel Transitions

```
Expand:   Height animate 0→auto, fade in content
Collapse: Fade out content, height animate auto→0
Add rack: Target bank scales 1.05, glows, then settles
Remove:   Bank fades out, empty state fades in
```
