# RC-505mk2 MCP — Test Prompts

> Copy-paste prompts for testing the MCP server and Claude Desktop extension.  
> Organized by workflow. Each section goes from **easy → hard**.

**Before device tests:** connect RC-505mk2 via USB in **Storage mode** (MENU → USB → STORAGE → CONNECT).

**Mode cheat sheet:**

| Mode | Trigger words | Expected first tool |
|------|---------------|---------------------|
| **Adapt** | genre, style, vibe, “something for…” | `list_rack_presets` |
| **Build** | from scratch, custom, greenfield, modules only | `list_fx_modules` |
| **Upload** | slot, load, push, merge, overwrite | `upload_memory` or `detect_device` |
| **General** | anything | context-dependent |

**Pass signals:** calls tools by name (no meta-search), ≤ 6 tool calls for simple tasks, no BEAT_* in wrong TFX slots, tips as objects not strings.

---

## 1. Quick smoke tests

Start here after install. Should complete in one session without clarification.

| # | Prompt |
|---|--------|
| 1 | Is my RC-505 connected? |
| 2 | List all bundled rack presets. |
| 3 | What FX modules do you have for vocals? |
| 4 | Show me racks tagged glitch or tfx. |
| 5 | What's in the vocal plate module? |
| 6 | What reverbs work on input vs track FX? |
| 7 | Explain IFX vs TFX on the RC-505mk2. |
| 8 | What are the special Track FX that only go in Slot A? |

---

## 2. Adapt — genre & style racks

Default mode when the user describes a vibe but **does not** ask for from-scratch. Agent should call `list_rack_presets` first.

### Vocals

| # | Prompt |
|---|--------|
| 1 | Create an RC-505 FX rack for modern R&B performance. |
| 2 | Create an RC-505 FX rack for neo-soul live vocals — warm and performance-ready. |
| 3 | I need a vocal rack for silky soul singing. |
| 4 | Build me something for pop vocals with a radio polish. |
| 5 | I want an ambient ethereal vocal wash for chill sets. |
| 6 | Give me an aggressive distorted vocal rack for dubstep drops. |
| 7 | Lo-fi vintage vocal processing — something dusty and intimate. |
| 8 | Telephone / radio voice effect rack for a skit interlude. |
| 9 | Vocal chop and glitch machine — performance FX for live looping. |
| 10 | Whisper-to-scream dynamics rack for dramatic vocal performances. |
| 11 | Autotune / vocoder rack — I have MIDI connected. |
| 12 | Vocal harmony stack with octave doubling. |

### Drums & percussion

| # | Prompt |
|---|--------|
| 1 | Create an RC-505 FX rack for DnB drum processing. |
| 2 | Jungle break processing — punchy, gritty, glitch-ready. |
| 3 | Electronic percussion rack for techno loops. |
| 4 | Tight acoustic percussion processing for hip-hop. |
| 5 | Dubstep drum rack with stutter and scatter options. |
| 6 | House music drum loop performance FX. |
| 7 | Industrial metal percussion — harsh and compressed. |

### Beatbox

| # | Prompt |
|---|--------|
| 1 | Clean beatbox foundation rack — minimal, punchy. |
| 2 | Synth beatbox / robo-percussion for EDM sets. |
| 3 | Beatbox rack with robot voice character. |
| 4 | Beatbox processing for a live hip-hop cypher. |

### Guitar & keys

| # | Prompt |
|---|--------|
| 1 | Clean neo-soul / lo-fi guitar rack. |
| 2 | Distorted rock guitar processing. |
| 3 | Ambient post-rock guitar wash. |
| 4 | Shoegaze guitar — dense and washy. |
| 5 | Clean electric piano / keys rack for jazz-pop. |
| 6 | Synth lead processing for EDM performances. |
| 7 | Acoustic guitar rack for singer-songwriter loops. |

### DJ / performance TFX

| # | Prompt |
|---|--------|
| 1 | Show me the stutter/glitch rack. |
| 2 | DJ filter sweep rack for breakdowns. |
| 3 | Beat mangler rack — what's in it? |
| 4 | Vinyl DJ toolkit for scratch and stop effects. |
| 5 | Ambient loop wash for fadeouts and transitions. |
| 6 | Performance FX rack for live loop layering. |

### Genre browse (vague → should still work)

| # | Prompt |
|---|--------|
| 1 | Something for chillwave. |
| 2 | Rack for lo-fi hip hop beatmaking. |
| 3 | Synthwave performance setup. |
| 4 | Jazz club vocal vibe. |
| 5 | Punk rock energy — vocals and guitar. |
| 6 | Downtempo ambient set. |
| 7 | EDM festival performance rack. |
| 8 | Indie folk acoustic performance. |

---

## 3. Build — greenfield from modules

Agent must **not** call `list_rack_presets` or `get_rack_preset`. Starts with `list_fx_modules`.

### Vocal chains

| # | Prompt |
|---|--------|
| 1 | Build a custom modern R&B vocal rack from scratch using FX modules — don't use bundled rack presets. |
| 2 | Build a custom neo-soul vocal rack from scratch (title: "Neo Soul Live Vox 2026") — FX modules only. IFX: compression + EQ + short reverb via fxModuleIds. TFX Bank A: filter sweep + delay throw. Save and print the slot table. |
| 3 | Create an original IFX chain for silky R&B vocals using gentle-comp, warm-eq, and vocal-plate — greenfield. |
| 4 | Design a live vocal rack from modules: glue comp → warm EQ → tight room reverb on IFX; HPF sweep + rhythmic delay on TFX. |
| 5 | Compose a whisper-intimate vocal chain from scratch — light comp, warm EQ, short plate, no heavy distortion. |
| 6 | Build a beatbox-input chain from modules: hard comp → presence EQ → noise gate. |

### Performance / TFX

| # | Prompt |
|---|--------|
| 1 | Design a new performance rack for live looping: pick modules by purpose, reference fxModuleIds, save as new rack. |
| 2 | From scratch: TFX bank with beat scatter in Slot A and roll in Slot B — follow hardware rules. |
| 3 | Greenfield DJ transition rack — filter sweep, vinyl stop, and ambient wash modules only. |
| 4 | Build a glitch performance bank from modules — scatter, roll, and granular freeze. |
| 5 | Create a breakdown rack: HPF sweep + reverse reverb swell + echo fadeout. No bundled presets. |

### Instrument-specific

| # | Prompt |
|---|--------|
| 1 | Build a clean guitar IFX chain from modules: preamp-clean → chorus-thicken → slapback-delay. |
| 2 | From scratch: distorted guitar rack with light overdrive IFX and isolator-kill for performance mutes. |
| 3 | Compose a keys rack from modules — warm EQ, tape echo, hall wash on TFX. |
| 4 | Build an acoustic percussion chain: gentle-comp → presence-eq → tight-room. |

### Constraint / regression tests

| # | Prompt | What to watch |
|---|--------|---------------|
| 1 | Build a vocal rack from modules only. Do not call list_rack_presets or get_rack_preset. | No preset browse |
| 2 | Create rack titled "Test Duplicate 2026" from modules. If it already exists, update it — never fetch bundled presets. | Duplicate id → `update_rack_preset` |
| 3 | Build IFX chain using pairsWith from list_fx_modules — skip get_fx_module. | No redundant gets |
| 4 | Save a rack with tips — make sure every tip is an object with type, title, and text. | Tips schema |
| 5 | Put BEAT_SCATTER in TFX Slot A Bank A and ROLL in Slot B — nothing in Slot C that violates rules. | Slot A rule |

---

## 4. Upload to device

Use `/rc505-upload` or natural language. Prefer `upload_memory { rack_id, slot_number }`.

### Simple upload

| # | Prompt |
|---|--------|
| 1 | Load the vocal plate rack to slot 5. |
| 2 | Upload the warm radio vocal rack to slot 3. |
| 3 | Put the beat mangler rack on memory slot 7. |
| 4 | Load the closest bundled vocal rack to memory slot 4 — pick neo-soul or R&B if available. |
| 5 | Send the DnB drum processor rack to slot 1. |
| 6 | Upload tfx-beat-mangle to slot 9. |
| 7 | Load vocal-warm to slot 2 with the name "WARM RADIO". |

### Merge vs overwrite

| # | Prompt |
|---|--------|
| 1 | Merge new TFX into slot 2 without losing my tracks. |
| 2 | Overwrite slot 6 completely with the ambient vocal wash rack. |
| 3 | Update slot 8's FX banks but keep everything else on the memory — merge mode. |
| 4 | Full reset of slot 10 with the clean beatbox foundation rack. |

### Upload after create/adapt

| # | Prompt |
|---|--------|
| 1 | Create an RC-505 FX rack for DnB drum processing and upload it to slot 1. |
| 2 | Build a neo-soul vocal rack from scratch and push it to slot 5. |
| 3 | Find the best glitch TFX rack and load it to slot 12. |
| 4 | Adapt a chillwave vocal rack, then upload to slot 3 — ask me if you need the slot. |

### Device checks

| # | Prompt |
|---|--------|
| 1 | Is my 505 connected? |
| 2 | Detect my RC-505 and tell me the mount path. |
| 3 | Upload vocal-plate to slot 5 — if the device isn't connected, tell me how to fix it. |
| 4 | After uploading to slot 4, eject the device safely. |

---

## 5. Browse & explore

Low-stakes discovery — good for testing list/get tools.

### Rack presets

| # | Prompt |
|---|--------|
| 1 | How many bundled rack presets are there? |
| 2 | List racks for Neo-Soul. |
| 3 | Show me all vocal racks. |
| 4 | What percussion racks do you have? |
| 5 | List racks in the tfx-performance section. |
| 6 | Find racks tagged glitch. |
| 7 | Compare vocal-warm vs vocal-lofi — what's different? |
| 8 | Open the beat mangler rack and explain each slot. |
| 9 | What's in perc-electronic? |
| 10 | Show me the rack template for tfx-beat-mangle — especially TFX Slot A placement. |

### FX modules

| # | Prompt |
|---|--------|
| 1 | List all IFX modules for vocals. |
| 2 | What TFX modules are good for transitions? |
| 3 | Show me dynamics modules and what they pair with. |
| 4 | Find a delay module for delay throws on TFX. |
| 5 | What modules use BEAT_SCATTER or BEAT_REPEAT? |
| 6 | List character / lo-fi modules. |
| 7 | Get the full param list for gentle-comp. |
| 8 | Which reverb modules work on IFX vs TFX? |

### FX types & params

| # | Prompt |
|---|--------|
| 1 | List all FX types available on IFX. |
| 2 | List FX types for TFX context. |
| 3 | Look up params for BEAT_SCATTER. |
| 4 | What are the valid TYPE values for BEAT_REPEAT? |
| 5 | Which FX types have a sequencer? |
| 6 | Look up REVERB params — I want to set TIME and MIX manually. |
| 7 | What's the parameter range for EQ LO-MID GAIN? |

---

## 6. Customize & edit racks

Tests create/update/delete and adaptation workflows.

| # | Prompt |
|---|--------|
| 1 | Start from vocal-warm and add a TFX filter sweep bank. |
| 2 | Copy the beat mangler rack but swap scatter for beat repeat. |
| 3 | Take perc-electronic and rename it "MY TECHNO PERC" with a shorter plate reverb on IFX. |
| 4 | Create a new rack based on guitar-clean but add distortion on TFX Bank B. |
| 5 | Update my neo-soul-live-vox-2026 rack — replace echo-fadeout with rhythmic-delay on TFX. |
| 6 | Delete the rack called "Test Duplicate 2026" if it exists. |
| 7 | Save a custom rack called "Steve Live Vox" with only IFX: gentle-comp → warm-eq → vocal-plate. |
| 8 | Add performance tips to the rack — one tip and one performance note. |
| 9 | Fix a rack that has BEAT_SCATTER in TFX Slot C — move it to Slot A. |

---

## 7. Memory & RC0 (no upload)

Generate files without touching the device.

| # | Prompt |
|---|--------|
| 1 | Generate RC0 for slot 7 but don't upload. |
| 2 | Build a memory config for vocal-warm on slot 3 and save it locally. |
| 3 | Create RC0 files for the DnB drum rack at slot 1 — base64 is fine. |
| 4 | Parse this memory config and tell me what's on each FX slot. *(paste XML if testing parse)* |
| 5 | Resolve rack perc-acoustic and show me the full memory layout. |
| 6 | List all saved memory configs in my user store. |

---

## 8. Reference & education

No device required. Tests whether the agent explains hardware correctly.

| # | Prompt |
|---|--------|
| 1 | Explain Input FX vs Track FX on the RC-505mk2. |
| 2 | Why does BEAT_SCATTER have to be in TFX Slot A? |
| 3 | Can I put two special beat FX in the same bank? |
| 4 | What's the difference between merge and overwrite upload? |
| 5 | How do I chain IFX modules A through D? |
| 6 | When should I use Track FX Bank A vs Bank B? |
| 7 | What's the 12-character limit on preset names? |
| 8 | How do sequencer steps work on the RC-505? |
| 9 | Should reverb go on IFX or TFX for live vocals? |
| 10 | Walk me through USB Storage mode step by step. |

---

## 9. Multi-step conversations

Simulate real back-and-forth. Run as separate messages in order.

### Session A — adapt then upload

1. Create an rc505 fx rack for dnb drum processing  
2. sure *(when asked about upload)*  
3. Slot 1  
4. eject the device when done  

### Session B — browse then customize

1. Show me your best neo-soul vocal racks  
2. I like vocal-warm — what's in the TFX banks?  
3. Add a delay throw on TFX Bank A Slot B  
4. Save it as "Warm Soul Plus"  
5. Upload to slot 6  

### Session C — build then iterate

1. Build a custom vocal rack from scratch — no bundled presets  
2. The reverb tail is too long — shorten vocal-plate TIME to 25  
3. Add beat repeat on TFX Bank B Slot A for fills  
4. Print the final slot table  
5. Upload to slot 8 in merge mode  

### Session D — troubleshooting

1. Upload vocal-plate to slot 5  
2. *(if fails)* device not found — what should I check?  
3. try again  
4. eject safely  

---

## 10. Ambiguous & adversarial prompts

Good for regression testing. Agent should pick a sensible mode without excessive clarifying questions.

| # | Prompt | Expected behavior |
|---|--------|-------------------|
| 1 | Make me a rack. | Ask one focused question OR default Adapt with broad list |
| 2 | Something cool for my loop station. | Browse presets or ask instrument/vibe once |
| 3 | I need FX. | Clarify or list categories |
| 4 | Fix my RC-505. | Explain limits; offer detect_device |
| 5 | Create a rack for everything. | Suggest All Genres rack or ask primary use case |
| 6 | Put scatter in slot C. | Reject or relocate to Slot A with explanation |
| 7 | Two beat scatters in bank A. | Explain one special FX per bank rule |
| 8 | Use preset X that doesn't exist. | list_rack_presets → closest match |
| 9 | Upload without a slot number. | Ask slot once, then proceed |
| 10 | Build from presets. *(contradiction)* | Follow "build" — modules only, or clarify |

---

## 11. Claude Desktop example prompts

Paste manually or use as starter prompts in conversation.

| Use case | Text |
|----------|------|
| Load rack to slot | Load an RC-505mk2 FX rack to memory slot **5**. Use list_rack_presets to find a match, then upload_memory with rack_id. |
| Adapt genre | Create an RC-505mk2 FX rack for **neo-soul** performance. Use list_rack_presets filtered by genre or tag, adapt if needed, and offer upload. |
| Build custom | Build a custom RC-505mk2 FX rack from scratch: **R&B vocal chain with performance filter sweep and delay throw**. Use list_fx_modules for IFX and TFX, then create_rack_preset with fxModuleIds. Do not browse bundled rack presets. |
| Check device | Check if my Roland RC-505mk2 is connected. Use detect_device. Remind me to enable USB Storage mode if not detected. |

---

## 12. Benchmark prompts

Use these to compare tool-call count across releases.

| Label | Prompt | Target |
|-------|--------|--------|
| Adapt baseline | create an rc505 fx rack for dnb drum processing | ≤ 6 calls; no schema errors |
| Adapt variant | create an rc505 fx rack for a modern rnb performance | No meta-search; no unnecessary clarifying questions |
| Adapt + upload | Load the closest bundled vocal rack to memory slot 4 — pick neo-soul or R&B if available. | 3–4 calls with device connected |
| Build strict | Build a custom modern R&B vocal rack from scratch using FX modules only — do not browse or adapt bundled rack presets. Compose IFX + TFX using fxModuleIds. Save and show slot layout. | No list_rack_presets; ≤ 5 calls |
| Build titled | Build a custom neo-soul vocal rack from scratch (title: "Neo Soul Live Vox 2026") — modules only. IFX: comp + EQ + short reverb. TFX Bank A: filter sweep + delay throw. Do not call get_rack_preset or list_rack_presets. | Duplicate id → update_rack_preset |

---

## 13. Bundled rack IDs (quick reference)

Use these when you want a **specific** rack in a prompt.

| ID | Title |
|----|-------|
| `vocal-warm` | Warm Radio Vocal |
| `vocal-lofi` | Lo-Fi / Vintage Vocal |
| `vocal-ambient` | Ambient / Ethereal Vocal Wash |
| `vocal-aggressive` | Aggressive Vocal FX |
| `vocal-glitch` | Vocal Chop / Glitch Machine |
| `vocal-tuned` | Autotune Vocals (Vocoder + MIDI) |
| `beatbox-clean` | Clean Beatbox Foundation |
| `beatbox-synth` | Synth Beatbox / Robo-Percussion |
| `perc-acoustic` | Tight Acoustic Percussion Rack |
| `perc-electronic` | Electronic Percussion Processing Rack |
| `tfx-beat-mangle` | Beat Mangler |
| `tfx-dj-filter` | DJ Filter Sweep |
| `tfx-vinyl-dj` | Vinyl DJ Toolkit |
| `tfx-ambient-wash` | Ambient Loop Wash |
| `guitar-clean` | Clean / Neo-Soul / Lo-Fi Guitar |
| `guitar-distorted` | Distorted / Rock / Metal Guitar |
| `guitar-ambient` | Ambient / Post-Rock Guitar |
| `keys-clean` | Clean Keys / Electric Piano |
| `keys-synth` | Synth Lead / Bass Processing |

**Genres in library:** Acoustic, Ambient, Beatbox, Blues, Chill, Chillwave, Downtempo, Dubstep, EDM, Electronic, Hip Hop, House, Indie, Industrial, Jazz, Lo-Fi, Lo-Fi Hip Hop, Metal, Neo-Soul, Pop, Post-Rock, Punk, R&B, Rock, Shoegaze, Soul, Synthwave, Techno

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical design |
| [UNIFIED_MCP_TOOLS.md](./UNIFIED_MCP_TOOLS.md) | Tool reference |
