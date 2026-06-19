# RC-505mk2 FX Rack Guide

## Project Summary & Continuation Guide

**Version 1.1.0 — February 16, 2026**
[rc505guide.com](https://rc505guide.com)

---

## Table of Contents

1. [Project Vision & Goals](#section-1-project-vision--goals)
2. [What Has Been Built](#section-2-what-has-been-built)
3. [RC-505mk2 Technical Reference](#section-3-rc-505mk2-technical-reference)
4. [Errors Found & Corrected](#section-4-errors-found--corrected-v100--v110)
5. [Preset File Generator — Research & Next Steps](#section-5-preset-file-generator--research--next-steps)
6. [Community & Discovery](#section-6-community--discovery)
7. [File Inventory](#section-7-file-inventory)
8. [Immediate Next Steps](#section-8-immediate-next-steps)

---

## Section 1: Project Vision & Goals

- **Project Objective:** Building a free FX rack reference website for the Roland RC-505mk2 loop station
- **Target Audience:** Loop station musicians, beatboxers, live performers, producers
- **Domain:** rc505guide.com
- **Deployment Platform:** Vercel (static site)

---

## Section 2: What Has Been Built

### 2.1 Original HTML Guide

- Single-file dark-themed HTML (`rc505mk2-visual-guide.html`, 1,583 lines)
- 12 sections with signal flow diagrams, rack cards, genre templates, performance tips

### 2.2 Enhanced HTML Version (`rc505mk2-guide-deploy/`)

- Added sidebar layout (CSS Grid 2-column)
- SEO meta tags, Open Graph, Twitter Cards, JSON-LD, GA4 placeholder
- Deployment files: `package.json`, `vercel.json`, `sitemap.xml`, `robots.txt`

### 2.3 React App (`rc505mk2-react/`) — THE MAIN DELIVERABLE

Vite + React for static site generation on Vercel. Data-driven architecture — all content rendered from `racks.json` (single source of truth).

**Key files:**

| File | Description |
|------|-------------|
| `src/data/racks.json` | v1.1.0, ~1,130 lines — all rack configs, sections, genre templates, master settings, vocoder guide, gear recs |
| `src/App.jsx` | Main orchestrator, interleaves sections |
| `src/components/RackCard.jsx` | Data-driven rack renderer with slot color badges |
| `src/components/SearchBar.jsx` | Full-text search across all content |
| `src/components/Sidebar.jsx` | Desktop sticky sidebar with navigation |
| `src/components/StaticSections.jsx` | Overview, SignalFlow, Saving, Mastering, Genre, Performance |
| `src/styles.css` | Full dark theme, CSS Grid layout, responsive at 1024px |
| `index.html` | SEO meta, OG tags, JSON-LD Article schema |
| `package.json`, `vercel.json`, `vite.config.js` | Deployment config |
| `public/robots.txt`, `public/sitemap.xml` | SEO files |

> **IMPORTANT:** `npm install` failed in sandbox (403 from registry). User needs to run `npm install && npm run build` locally before deploying.

### 2.4 PDF Cheat Sheet

- **Location:** `rc505mk2-react/public/assets/RC505mk2-Rack-Presets-CheatSheet.pdf`
- **Format:** 26 pages, landscape, print-friendly (white background, black text)
- **Generator:** `create_cheatsheet_v3.py` (Python, reportlab)
- **Content:** Cover, How to Use, Signal Flow, 15 rack cards, 5 genre templates, Master Settings, Pro Tips, Creative Combos, Back Cover

---

## Section 3: RC-505mk2 Technical Reference

### 3.1 Device Architecture

- **4 Input FX slots (A-D)** — applied to incoming audio, printed to recording (destructive)
- **4 Track FX slots (A-D) per track** — applied after recording (non-destructive)
- **5 tracks, 99 memory slots**
- Master Comp, Master EQ, Master FX

**Signal Flow:**

```
INPUT (Mic/Inst) → Noise Suppress → Input FX A→B→C→D → Record to Track → Track FX A-D → Master Bus → Output
```

### 3.2 Valid Input FX / Track FX Types (CRITICAL)

**Both Input FX and Track FX:**

`LPF` `HPF` `BPF` `PHASER` `FLANGER` `RING.MOD` `SYNTH` `G2B` `SUSTAINER` `LO-FI` `RADIO` `AUTO RIFF` `PITCH BEND` `ROBOT` `ELECTRIC` `SLOW GEAR` `TRANSPOSE` `VOCODER` `OSC VOC` `HRM MANUAL` `HRM AUTO` `OSC BOT` `DIST` `DYNAMICS` `EQ` `PREAMP` `ISOLATOR` `OCTAVE` `AUTO PAN` `MANUAL PAN` `STEREO ENHANCE` `TREMOLO` `VIBRATO` `PATTERN SLICER` `STEP SLICER` `DELAY` `PANNING DELAY` `REVERSE DELAY` `MOD DELAY` `TAPE ECHO1` `TAPE ECHO2` `GRANULAR DELAY` `WARP` `TWIST` `FREEZE` `CHORUS` `REVERB` `GATE REVERB` `REVERSE REVERB` `ROLL1` `ROLL2`

**Track FX only:**

`BEAT SCATTER` `BEAT REPEAT` `BEAT SHIFT` `VINYL FLICK`

**NOT Valid as FX Slot Types:**

| Invalid Name | Use Instead |
|-------------|-------------|
| COMP | DYNAMICS |
| NOISE SUPPR | Input-level setting, not an FX slot |
| GUITAR SIM | PREAMP |
| PITCH SHIFT | TRANSPOSE |
| FILTER | LPF / HPF / BPF |
| SLICER | PATTERN SLICER or STEP SLICER |

### 3.3 Input-Level Controls (separate from FX slots)

- **Input Compressor:** `MENU > INPUT > COMP` — basic level control
- **Noise Suppress:** `MENU > INPUT > NS THRESHOLD` — noise gate
- These work alongside FX slots, not instead of them

### 3.4 Vocoder & Pitch Effects

| Effect | Description |
|--------|-------------|
| VOCODER | Requires MIDI keyboard connected to MIDI IN, VOICE channel configured |
| OSC VOC | Built-in oscillator carrier, no external gear needed |
| ROBOT | Standalone robotic voice effect |
| ELECTRIC | Electronic voice modulation |
| TRANSPOSE | Semitone shifting for harmonies |
| HRM AUTO | Intelligent harmonies via MIDI chord input |

---

## Section 4: Errors Found & Corrected (v1.0.0 → v1.1.0)

**24 effect name errors fixed across all 15 racks:**

| Error | Occurrences | Notes |
|-------|-------------|-------|
| COMP → DYNAMICS | 11 | With sub-types NATURAL COMP, D-COMP, VOCAL COMP |
| NOISE SUPPR → DYNAMICS | 3 | Plus tips directing users to input-level NS |
| GUITAR SIM → PREAMP | 3 | |
| PITCH SHIFT → TRANSPOSE | 3 | |
| FILTER → LPF/BPF | 3 | |
| SLICER → PATTERN SLICER | — | BEAT RPT → BEAT REPEAT, PAN → AUTO PAN |

- **beatbox-synth rack:** Changed from VOCODER to SYNTH (no MIDI required for beatbox)
- **New content:** Added vocoderGuide section, Input Comp/NS guidance tips
- **All 5 genre templates:** Corrected

---

## Section 5: Preset File Generator — Research & Next Steps

### 5.1 File Format Discovery

- RC-505mk2 stores data on SD card, accessible via USB Storage Mode
- Folder structure: `ROLAND/DATA/MEMORY1.RC0` (user presets), `MEMORY2.RC0` (factory), `SYSTEM.RC0` (system settings)
- `ROLAND/WAVE/` contains track audio (WAV, 44.1kHz, 32-bit float)
- The `.RC0` files are **XML-based configuration** (NOT pure binary)

### 5.2 Community Tools (key repos)

| Repo | Tech | Target |
|------|------|--------|
| `westlicht/rc505-editor` | C++, JUCE | Original RC-505 |
| `dfleury2/boss-rc500-editor` | C++, web-based | RC-500 XML editor |
| `tom1lee/rc500-reader` | C++ | Parses MEMORY1.RC0 to JSON |
| `shaenzi/boss_rc600` | Python | Edits RC-600 settings at XML level |
| `paulelong/RCEditor` | .NET MAUI | RC-600 |
| `rc600editor.com` | Commercial | RC-600 / RC-505mk2 editor |

### 5.3 What We Know

- `.RC0` files are XML, not binary
- Python's `xml.etree.ElementTree` can parse/generate them
- The RC-600 and RC-505mk2 share the same community editor
- A Python implementation already exists for the RC-600 (`shaenzi/boss_rc600`)
- VOCODER uses MIDI VOICE channel for note messages

### 5.4 What's Needed to Build the Generator

1. A sample `MEMORY1.RC0` file from the user's actual RC-505mk2 device
2. Connect device via USB-B cable
3. Activate USB Storage Mode from device menu
4. Copy `ROLAND/DATA/MEMORY1.RC0` to computer

Once we have the file, we can:
- Analyze the XML structure
- Map parameter names to XML tags
- Build a Python script that converts `racks.json` → loadable RC0 memory files

> This became the core capability of the current MCP assistant: generate and upload presets directly to the device.

### 5.5 Implementation Plan

1. User provides `MEMORY1.RC0` sample file
2. Analyze XML structure (tag names, nesting, parameter encoding)
3. Cross-reference with `shaenzi/boss_rc600` Python code and `dfleury2/boss-rc500-editor`
4. Build Python converter: `racks.json` → `MEMORY1.RC0`
5. Test by loading onto device

---

## Section 6: Community & Discovery

### 6.1 Launch Sequence

1. Deploy React site to Vercel
2. Share in loop-station communities for feedback

### 6.2 Promotion Channels

- **Reddit:** r/LoopArtists, r/rc505, r/beatbox, r/WeAreTheMusicMakers
- **YouTube:** Partner with loopstation YouTubers for guide reviews
- **Facebook Groups:** RC-505 user groups
- **SEO:** Target "RC-505 FX settings", "RC-505 presets", "loop station setup guide"

---

## Section 7: File Inventory

Complete list of all files created with their paths and purposes:

| File Path | Purpose |
| --- | --- |
| `/mnt/outputs/rc505mk2-visual-guide.html` | Original HTML guide |
| `/mnt/outputs/rc505mk2-guide-deploy/` | Enhanced HTML version with deployment files |
| `/mnt/outputs/rc505mk2-react/src/data/racks.json` | Single source of truth (v1.1.0, ~1,130 lines) |
| `/mnt/outputs/rc505mk2-react/src/App.jsx` | Main React app orchestrator |
| `/mnt/outputs/rc505mk2-react/src/components/RackCard.jsx` | Data-driven rack renderer |
| `/mnt/outputs/rc505mk2-react/src/components/SearchBar.jsx` | Full-text search component |
| `/mnt/outputs/rc505mk2-react/src/components/Sidebar.jsx` | Desktop sticky sidebar |
| `/mnt/outputs/rc505mk2-react/src/components/StaticSections.jsx` | Overview, SignalFlow, Mastering sections |
| `/mnt/outputs/rc505mk2-react/src/styles.css` | Full dark theme CSS |
| `/mnt/outputs/rc505mk2-react/index.html` | SEO-optimized entry point |
| `/mnt/outputs/rc505mk2-react/package.json` | Node.js dependencies |
| `/mnt/outputs/rc505mk2-react/vercel.json` | Vercel deployment config |
| `/mnt/outputs/rc505mk2-react/vite.config.js` | Vite build config |
| `/mnt/outputs/rc505mk2-react/public/robots.txt` | SEO robots file |
| `/mnt/outputs/rc505mk2-react/public/sitemap.xml` | SEO sitemap |
| `/mnt/outputs/rc505mk2-react/public/assets/RC505mk2-Rack-Presets-CheatSheet.pdf` | Print-friendly cheat sheet (26 pages) |
| `/mnt/outputs/create_cheatsheet_v3.py` | PDF generator script (Python, reportlab) |

---

## Section 8: Immediate Next Steps

- [ ] **Get MEMORY1.RC0 from device** — Connect RC-505mk2 via USB, activate USB Storage Mode, copy the file to computer
- [ ] **Build preset file generator** — Python script to convert `racks.json` → loadable `.RC0`
- [ ] **Deploy React site** — Run `npm install && npm run build` locally, deploy to Vercel
- [ ] **Create content calendar** — Monthly new rack recipes and site updates
