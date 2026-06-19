# RC-505mk2 FX Rack Guide — Project Vision

## What This Is

A free, web-based reference site for the Roland RC-505mk2 loop station. The site provides ready-to-use FX rack configurations — complete signal chains with exact parameter names and values that users can dial into their device immediately. It targets live loopers, beatboxers, vocalists, and guitarists who use or are considering the RC-505mk2.

The site lives at **rc505guide.com**.


## The Problem It Solves

The RC-505mk2 has over 50 effect types, each with multiple parameters, spread across Input FX and Track FX slots. The official documentation is a dry parameter reference — it tells you what each knob does, but not how to combine effects into usable configurations for real musical situations.

New owners spend hours scrolling menus and guessing at values. Experienced users plateau because they haven't explored combinations outside their comfort zone. There's no central, reliable resource that bridges the gap between "here are the parameters" and "here's a configuration that sounds good for X."

This site is that bridge.


## Core Principles

**Accuracy over everything.** Every parameter name, value range, and option in this guide matches exactly what appears on the RC-505mk2 screen. The data was extracted from the official Roland parameter documentation and cross-verified against a physical unit. A machine-readable reference file (`fx-reference.json`) serves as the single source of truth, and all 39 rack presets are validated against it programmatically. If a user follows a rack guide, the settings must work the first time — no guessing, no "close enough."

**Practical, not theoretical.** Each rack is a complete, usable configuration — not a vague suggestion to "try some reverb." The guide specifies which FX type goes in which slot, what every parameter should be set to, and why. Tips explain the musical intent and how to adapt settings to taste.

**Technique-first for beatbox/voice-to-instrument racks.** The site doesn't just list FX settings for turning voice into a bass or trumpet — it includes vocal technique guidance. The FX chain refines and transforms a shaped source sound; the user needs to know how to produce that source sound with their mouth, throat, and breath. Each beatbox-to-instrument rack pairs specific technique instructions with the signal chain.

**Free and open.** The guide content is free to read. Revenue comes from optional paid preset packs, affiliate links to recommended gear, display advertising, and an email list — not from gating the reference material itself.


## Content Structure

The site organizes content into three tiers.

**Foundational sections** (static content) explain how the RC-505mk2 signal chain works, how to save and manage presets, and how to think about mastering and output. These give context so the rack configurations make sense.

**Rack preset sections** (the core of the site) are grouped by instrument and use case:

- Vocal Autotune — Vocoder + MIDI, Robot, Electric, and oscillator-based pitch effects
- Vocal Creative — Lo-fi, telephone, glitch, whisper, ambient wash, radio vocal
- Vocal Layers — Harmony stacking, choir building, vocal doubling
- Beatbox Foundation — Clean vocal percussion and synth-beatbox processing
- Beatbox → Instruments — Voice into sub-bass, electric bass, trumpet, strings (with technique guides)
- Beatbox → Electronic — Wobble bass, synth leads, drum machines, filth bass (with technique guides)
- Percussion — Acoustic and electronic percussion processing
- Guitar Clean — Jazz, indie, neo-soul clean tones via PREAMP modeling
- Guitar Driven — Blues crunch, punk, djent, and high-gain metal
- Guitar Atmospheric — Ambient/post-rock and shoegaze walls of sound
- Guitar Acoustic — Enhancement and fingerstyle clarity
- Keys — Electric piano and synth lead/bass processing

**Template sections** (genre templates) show how to assign different rack presets across the RC-505mk2's five tracks to build a complete performance setup for a specific genre.

Currently the site has **39 rack presets** across **12 rack categories**, covering **28 genres** and using **55 distinct FX types**.


## Monetization Strategy

The site is designed to generate revenue without compromising the free reference content.

**Preset pack ($4.99).** Every FX chain as a downloadable configuration file, plus a printable cheat sheet PDF. This is the convenience product — the guide is free, but manually entering 39 multi-slot configurations is tedious.

**Affiliate gear links.** Each section recommends relevant gear (microphones, cables, the RC-505mk2 itself) with affiliate links. Recommendations are contextual and genuinely useful, not shoehorned.

**Display advertising.** Reserved slots for AdSense, Carbon, or Ezoic ads are built into the layout — full-width banners between sections and a sidebar ad slot on desktop. Mobile gets a dismissible bottom banner.

**Email list.** Multiple subscribe touchpoints (inline promos, exit-intent modal) build an audience for monthly rack recipes and eventual product launches.

**Buy Me a Coffee.** A tip jar for users who found value in the free content.


## Technical Architecture

The site is a single-page React application built with Vite. All content is data-driven from `racks.json`, which means adding or editing presets requires changing one JSON file — not touching React components.

Key data files:

- `racks.json` — All 39 rack presets, 18 sections, filter configuration, genre templates, and metadata. Each rack includes input FX slots, track FX slots, tips, genre tags, and auto-generated FX type arrays for filtering.
- `fx-reference.json` — Complete parameter reference for all 55+ RC-505mk2 effect types, extracted from the official documentation. Used for validation, not rendering.
- `promoConfig.js` — Controls promotional element placement, content, and gear recommendations. Separated from editorial content for clean maintainability.

Key components:

- `App.jsx` — Orchestrates section rendering, manages filter state, handles nav/search/filter toolbar
- `RackCard.jsx` — Data-driven renderer for any rack preset (input FX chain, track FX chain, tips, genre tags, gear recommendations)
- `FilterBar.jsx` — FX type and genre multi-select dropdown filters with active pill indicators and live result counts
- `SearchBar.jsx` — Full-text search across all racks, genres, FX names, and parameter values
- `StaticSections.jsx` — Foundational content (overview, signal flow, saving, mastering, genre templates, performance tips)
- `Sidebar.jsx` — Desktop sidebar with promo widgets and ad slots

The dark theme uses a five-color accent system (cyan, purple, pink, green, orange) for visual hierarchy across different content types.


## Quality Assurance

A Python validation script checks every rack preset against `fx-reference.json` before any release. It verifies:

- Every FX type name exists in the reference
- Every parameter name is valid for its FX type
- No orphaned racks (every rack's section exists in the sections list)
- No empty sections (every defined section has at least one rack)

This catches errors that would otherwise only surface when a user tries to dial in settings on their device and finds a parameter that doesn't exist.


## What's Next

Near-term priorities:

- **More presets.** The 39 current racks are a strong foundation, but the long tail of creative combinations is huge. Specific gaps: vocal harmony with pitch shifter, creative delay feedback loops, sidechain-style pumping effects, lo-fi production chains.
- **User-submitted racks.** A submission flow where community members can share their own configurations, vetted against fx-reference.json for accuracy before publishing.
- **Video embeds.** Short demo clips showing what each rack sounds like in practice. Audio is the missing context — users can see the settings but can't hear the result until they dial it in.
- **MIDI keyboard setup guide.** The Vocoder and pitch-based racks assume a MIDI keyboard is connected; a dedicated setup walkthrough would reduce friction.
- **Preset file generator.** Auto-generate RC-505mk2-compatible preset files from the JSON data, eliminating manual parameter entry entirely.

Longer-term:

- **RC-505 (original) and RC-600 variants.** The same concept adapted for Roland's other loop stations, which share many but not all FX types.
- **Interactive rack builder.** A drag-and-drop interface where users construct their own signal chains, with parameter validation and community sharing.
- **Course/tutorial product.** Paid video content teaching RC-505mk2 performance techniques, using the rack guide as the companion reference.
