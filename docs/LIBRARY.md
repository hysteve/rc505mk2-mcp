# RC-505mk2 Library API Reference

> **Note (v2):** Package name is `rc505mk2-mcp`. Install via `npx rc505mk2-mcp` or clone this repo for local development.

TypeScript library for generating, parsing, and managing Boss RC-505mk2 loop station memory preset files.

## Features

- **Preset generation** — Build RC0 memory files from FX chain descriptions with human-readable parameter values. Supports single-step creation (`create_preset`) or a two-phase build-then-generate workflow.
- **RC0 parsing** — Parse existing RC0 XML files back into structured MemoryConfig objects. Handles the A/B file pair count-based active detection.
- **FX module library** — 33 curated, reusable FX module presets organized by category. Each module defines a single effect with tuned parameters, sequencer steps, genre tags, and pairing suggestions.
- **Config inheritance** — Three-layer inheritance model (FxModule → Rack → MemoryConfig) with override tracking. Slots reference a source module and store only the parameters that differ.
- **Memory merging** — Merge new FX into existing device memory at the bank level. Banks present in the incoming config replace the same bank on-device; all other banks, tracks, and settings are preserved.
- **Composite presets** — Compose multiple rack presets into a single memory slot, mapping different racks to banks A–D.
- **Device upload** — Auto-detect a connected RC-505mk2 via USB (macOS, Linux, Windows), back up existing memory slots, and write RC0 files directly to the device.
- **ZIP downloads** — Generate downloadable ZIP archives containing RC0 file pairs and a human-readable README.
- **Context-aware FX indexes** — Correctly resolve the different numeric indexes the device uses for IFX vs TFX chains.
- **53 FX types** — 49 standard effects plus 4 special Track FX, with 15 sequencer-capable variants.
- **40+ parameter transforms** — Bidirectional conversion between human-readable values (reverb types, EQ gains, note lengths, frequencies) and the numeric values the RC0 format expects.
- **Zod schemas** — All types derived from Zod schemas. Runtime validation with `buildFxParamsSchema()` for per-FX parameter checking.
- **MCP server** — Expose all library features to AI assistants via the Model Context Protocol.
- **CLI** — Command-line tools for generating presets, listing FX types, and looking up parameters.

## Installation

```bash
npm install @rc505mk2/lib
```

## Core Concepts

### RC0 File Format

The RC-505mk2 stores each memory slot as a pair of XML files on its SD card:

```
ROLAND/DATA/MEMORY/
  MEMORY001A.RC0
  MEMORY001B.RC0
  ...
  MEMORY099A.RC0
  MEMORY099B.RC0
```

Each file contains a `<count>` field (4-digit hex). The device loads whichever file has the higher count. This library handles generating both files with correctly incremented counts.

RC0 XML is non-standard — it uses numeric tag names and stores content outside the root element — so this library uses custom string-based XML operations rather than a DOM parser.

### Type Hierarchy

The library uses three main data structures that form a hierarchy from user-facing to device-facing:

```
FxModule  →  Rack  →  MemoryConfig  →  RC0 XML
(reusable)   (preset)  (device-ready)   (on-disk)
```

#### FxModule

A single reusable FX preset with tuned parameters. Modules are the building blocks that racks are composed from.

```typescript
interface FxModule {
  id: string              // Kebab-case identifier, e.g. "hall-wash"
  effect: string          // RC0 FX name, e.g. "REVERB"
  title: string           // Display name, e.g. "Hall Wash"
  category: string        // Organization category (dynamics, tone, space, time, pitch, performance)
  context: FxContext[]    // Where it can be used: ['ifx'], ['tfx'], or ['ifx', 'tfx']
  usage: 'chain' | 'individual' | 'both'
  description: string
  params: FxParam[]       // Tuned parameter values
  sequencer?: FxParam[]   // Optional 16-step sequencer configuration
  tags?: string[]         // Genre/style tags for filtering
  pairsWith?: string[]    // Suggested companion module IDs
}
```

Modules are stored as individual JSON files under `data/fx-modules/{category}/`, organized by effect category (dynamics, tone, space, time, pitch, performance).

#### Rack

A complete preset combining multiple FX modules across Input FX and Track FX chains, with optional device settings.

```typescript
interface Rack {
  id: string
  section: string
  title: string
  icon: string
  genres: string[]
  inputType: string
  description: string
  inputFx: FxSlotData[]    // Input FX chain (IFX)
  trackFx: FxSlotData[]    // Track FX chain (TFX)
  tips: Tip[]              // Usage tips (tip, performance, how, warning)
  settings?: PresetSettings
  fxTypes?: string[]
  tags?: string[]
  badge?: 'new' | 'trending' | 'popular'
}
```

Each `FxSlotData` in the chain can optionally reference an `fxModuleId`, inheriting the module's parameters and storing only overrides:

```typescript
interface FxSlotData {
  slot: 'A' | 'B' | 'C' | 'D'
  bank?: 'A' | 'B' | 'C' | 'D'
  effect: string
  fxModuleId?: string       // Source module reference
  params: FxParam[]         // Full resolved parameter set
  overrides?: FxParam[]     // Only params that differ from the module
  sequencer?: FxParam[]     // 16-step sequencer values
}
```

#### MemoryConfig

The intermediate JSON representation that maps directly to the device's memory structure. This is what gets converted to RC0 XML.

```typescript
interface MemoryConfig {
  version: 1
  slotNumber: number           // 1–99
  name: string                 // Max 12 ASCII characters
  inputFx: MemoryFxSection     // Input FX chain (IFX)
  trackFx: MemoryFxSection     // Track FX chain (TFX)
  tracks?: MemoryTrackSettings[]
  master?: MemoryMasterSettings
  rec?: MemoryRecSettings
  play?: MemoryPlaySettings
  rhythm?: MemoryRhythmSettings
}
```

FX are organized into **banks** (A–D) with up to 4 **slots** per bank:

```typescript
interface MemoryFxSection {
  activeBank?: number       // 0–3 (maps to A–D)
  banks: MemoryBank[]       // Up to 4 banks
}

interface MemoryBank {
  bank: 'A' | 'B' | 'C' | 'D'
  sourceRackId?: string     // Tracks which rack preset populated this bank
  slots: MemoryFxSlot[]     // Up to 4 FX slots
}

interface MemoryFxSlot {
  slot: 'A' | 'B' | 'C' | 'D'
  effect: string
  enabled?: boolean
  fxModuleId?: string       // Inheritance tracking
  params: FxParam[]
  overrides?: FxParam[]
  sequencer?: FxParam[]
}
```

### Config Inheritance

The inheritance system allows FX slots to reference a source module and track only what changed. This keeps configs compact and lets module updates propagate automatically.

```typescript
import {
  resolveSlotParams,   // Expand module + overrides → full params
  computeOverrides,    // Diff params against module → minimal overrides
  isParamOverridden,   // Check if a specific param is overridden
  resolveSlot,         // Return slot with fully expanded params
  mergeParams,         // Merge base params with override values
} from '@rc505mk2/lib'

// Resolve a slot's effective params from its source module
const params = resolveSlotParams(slot, (id) => moduleStore.getById(id))

// After editing, compute the minimal override set
const overrides = computeOverrides(module.params, editedParams)
```

When a slot has `fxModuleId` set:
1. The module's params are the **base** values
2. `overrides` contains only the params that differ from the base
3. `params` always holds the fully resolved set (base + overrides merged)
4. If the referenced module is deleted, params are frozen as-is

### Context-Aware FX Indexes

The device uses different numeric indexes for the same effect depending on whether it appears in the Input FX (IFX) or Track FX (TFX) chain. For example, `BEAT_SCATTER` is index 49 in TFX but doesn't exist in IFX. Indexes 0–48 are shared; higher indexes diverge.

```typescript
import { resolveFxIndex, fxNameFromIndex } from '@rc505mk2/lib'

resolveFxIndex('BEAT_SCATTER', 'tfx')  // 49
resolveFxIndex('BEAT_SCATTER', 'ifx')  // undefined (not available in IFX)

fxNameFromIndex(49, 'tfx')             // "BEAT_SCATTER"
fxNameFromIndex(49, 'ifx')             // "TAPE_ECHO_V505V2"
```

### FX Types

The library defines 53 FX types across several categories:

| Category | Effects |
|----------|---------|
| **Filters** | LPF, BPF, HPF (each with \_SEQ variant) |
| **Modulation** | PHASER, FLANGER, CHORUS, TREMOLO, VIBRATO, AUTO_PAN, MANUAL_PAN, STEREO_ENHANCE (most with \_SEQ) |
| **Pitch** | TRANSPOSE, PITCH_BEND, ROBOT, ELECTRIC, HARMONIST_MANUAL, HARMONIST_AUTO, VOCODER, OSC_VOCODER, OSC_BOT (several with \_SEQ) |
| **Tone** | PREAMP, DIST, DYNAMICS, EQ, LOFI, RADIO |
| **Time** | DELAY, PANNING_DELAY, REVERSE_DELAY, MOD_DELAY, TAPE_ECHO, TAPE_ECHO_V505V2, GRANULAR_DELAY |
| **Performance** | WARP, TWIST, ROLL, ROLL_V505V2, FREEZE, PATTERN_SLICER, STEP_SLICER |
| **Synth** | SYNTH, RING_MODULATOR, G2B, SUSTAINER, AUTO_RIFF, SLOW_GEAR, OCTAVE, ISOLATOR |
| **Reverb** | REVERB, GATE_REVERB, REVERSE_REVERB |
| **Special Track FX** | BEAT_SCATTER, BEAT_REPEAT, BEAT_SHIFT, VINYL_FLICK (TFX slot A only) |

**15 sequencer-capable FX** have a `_SEQ` variant with a built-in 16-step parameter sequencer: LPF, BPF, HPF, PHASER, FLANGER, SYNTH, RING_MODULATOR, TRANSPOSE, PITCH_BEND, OSC_BOT, ISOLATOR, OCTAVE, MANUAL_PAN, TREMOLO, VIBRATO.

### Parameter Transforms

Each FX parameter has a bidirectional transform pair that converts between human-readable values and the numeric values the RC0 format expects. There are 40+ specialized transforms:

| Transform | Purpose | Example |
|-----------|---------|---------|
| `num` | Pass-through numeric | `"80"` → `80` |
| `eqGain` | Centered ±20 dB range | `"-6"` → `14` |
| `reverbType` | Reverb algorithm enum | `"HALL1"` → `0` |
| `preampType` | Amp model enum (9 types) | `"JC120"` → `0` |
| `dynamicsType` | Compressor type enum (19 types) | `"HARDCOMP"` → `1` |
| `noteValue` | Tempo-synced note length | `"QUARTER"` → `5` |
| `rateValue` | LFO rate (numeric or note) | `"3/4"` → note index |
| `onOff` | Boolean toggle | `"ON"` → `1` |
| `transposeSemi` | Centered ±12 semitones | `"-3"` → `9` |
| `seqRate` / `seqMax` | Sequencer timing and range | |

Every forward transform has a corresponding **reverse transform** for parsing RC0 files back to display values — enabling reliable round-tripping.

Transforms are wired together in `PARAM_MAP`:

```typescript
import { PARAM_MAP, SEQ_TARGETS } from '@rc505mk2/lib'

const reverbParams = PARAM_MAP['REVERB']
// { TYPE: { tag: 'A', transform: reverbType, reverse: reverseReverbType },
//   TIME: { tag: 'B', transform: num, reverse: reverseNum }, ... }

// Sequencer targets: which params each sequencer FX can modulate
SEQ_TARGETS['TRANSPOSE_SEQ']  // [0, 1, 2] → maps to [TRANS, FINE, MIX]
```

### Memory Merging

When uploading to a device, merge mode preserves existing work:

```typescript
import { mergeMemoryConfigs } from '@rc505mk2/lib'

const merged = mergeMemoryConfigs(existing, incoming)
```

Merge strategy:
- **FX sections**: Bank-level merge — incoming banks replace matching banks in existing; untouched banks are preserved
- **Track settings**: Per-track merge by track number
- **Scalar settings** (name, master, rec, play, rhythm): overwritten only when explicitly present in incoming

### Zod Schema Validation

All types are inferred from Zod schemas — no manual interface duplication. Schemas are available for runtime validation:

```typescript
import {
  MemoryConfigSchema,
  RackSchema,
  FxModuleSchema,
  buildFxParamsSchema,
  validateFxModuleParams,
} from '@rc505mk2/lib'

// Validate a full memory config
const result = MemoryConfigSchema.safeParse(data)

// Build a dynamic schema for a specific FX type's params
const reverbParamsSchema = buildFxParamsSchema('REVERB')
reverbParamsSchema.parse([{ name: 'TYPE', value: 'HALL1' }])
```

## Usage

### Generate an RC0 preset from a Rack

```typescript
import { generatePresetXml, getDefaultTemplate } from '@rc505mk2/lib'
import type { Rack } from '@rc505mk2/lib'

const rack: Rack = {
  id: 'warm-reverb',
  section: 'reverb',
  title: 'WARM SPACE',
  icon: 'reverb',
  genres: ['ambient'],
  inputType: 'mic',
  description: 'Warm reverb for vocals',
  inputFx: [
    {
      slot: 'A', bank: 'A', effect: 'REVERB',
      params: [
        { name: 'TYPE', value: 'HALL1' },
        { name: 'TIME', value: '80' },
      ],
    },
  ],
  trackFx: [],
  tips: [],
}

const template = getDefaultTemplate()
const xml = generatePresetXml(template, rack, '0001')
```

### Two-phase build: MemoryConfig → RC0 file pair

```typescript
import {
  rackToMemoryConfig,
  memoryConfigToRc0Pair,
  getDefaultTemplate,
} from '@rc505mk2/lib'

const config = rackToMemoryConfig(rack, 42)
const template = getDefaultTemplate()
const { a, b } = memoryConfigToRc0Pair(template, config)
// a = MEMORY042A.RC0 content, b = MEMORY042B.RC0 content
```

### Parse an existing RC0 file

```typescript
import { parseRC0, parseRC0PairActive } from '@rc505mk2/lib'

// Single file
const config = parseRC0(xmlString, 1)
console.log(config.name)            // "WARM SPACE"
console.log(config.inputFx.banks)   // MemoryBank[]

// File pair — determines which file is active by hex count
const pair = parseRC0PairActive(xmlA, xmlB, 1)
console.log(pair.active)            // 'a' or 'b'
```

### Generate a ZIP for download

```typescript
import { generatePresetZipBuffer } from '@rc505mk2/lib'

const buffer = generatePresetZipBuffer(template, rack, 42, 'A')
// Returns a Uint8Array — write to disk or convert to Blob
```

In the browser, use `generatePresetZipBuffer` from the main export and trigger downloads with a small DOM helper (the package is MCP/Node-first; no separate browser bundle).

```typescript
import { generatePresetZipBuffer } from 'rc505mk2-mcp'

const buffer = generatePresetZipBuffer(template, rack, 42)
// Convert to Blob and trigger download in your UI layer
```

### Compose multiple racks into one memory slot

```typescript
import { buildCompositeConfig, generateMemoryZipBuffer } from '@rc505mk2/lib'

// Map banks to rack IDs
const state = { slotNumber: 1, A: 'rack-1', B: 'rack-2', C: null, D: null }
const config = buildCompositeConfig(state, allRacks)
const zip = generateMemoryZipBuffer(template, state, allRacks)
```

### Resolve FX module inheritance

```typescript
import { resolveSlotParams, computeOverrides } from '@rc505mk2/lib'

// Resolve full params from a module-backed slot
const fullParams = resolveSlotParams(slot, (id) => modules.get(id))

// After editing, compute minimal overrides
const overrides = computeOverrides(module.params, editedParams)
```

### Look up FX parameters

```typescript
import { PARAM_MAP, EFFECT_NAME_MAP, RC0_FX_NAMES } from '@rc505mk2/lib'

// All 53 FX type constants
console.log(RC0_FX_NAMES.REVERB)       // "REVERB"
console.log(RC0_FX_NAMES.BEAT_SCATTER) // "BEAT_SCATTER"

// Normalize user-facing names to internal names
EFFECT_NAME_MAP['Lo-Fi']               // "LOFI"

// Get parameter definitions for an FX
const reverbParams = PARAM_MAP['REVERB']
// { TYPE: { tag: 'A', transform: reverbType },
//   TIME: { tag: 'B', transform: num }, ... }
```

### Detect and upload to a connected device

```typescript
import { detectDevice, uploadToDevice } from '@rc505mk2/lib/node'

const device = await detectDevice()
if (device) {
  console.log(`Found at ${device.path} (${device.volumeName})`)
  const result = await uploadToDevice(xmlA, xmlB, 42, {
    devicePath: device.path,
    backup: true,
  })
}
```

## Package Exports

The library ships two entry points:

| Import Path | Environment | Contents |
|-------------|-------------|----------|
| `rc505mk2-mcp` | Universal | Types, schemas, FX constants, transforms, generator, parser, config, download, template |
| `rc505mk2-mcp/node` | Node.js | Device detection, upload, file stores |

Both ESM and CJS builds are included for the main and Node exports.

## CLI

```bash
# Generate RC0 files from a MemoryConfig JSON file
rc505mk2 generate config.json --slot 42 --output ./out

# List all available FX types
rc505mk2 list-fx --context tfx

# Look up parameters for a specific FX
rc505mk2 lookup-fx REVERB
```

## MCP Server

The package includes an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that gives AI assistants direct access to RC-505mk2 FX lookup, preset generation, and memory file tools. It communicates over stdio.

### Setup

#### 1. Build the server

From the package directory:

```bash
npm install
npm run build
```

This produces the server binary at `dist/mcp/server.js`. The MCP SDK is an optional peer dependency — it's included in devDependencies for building, but if you install the package from npm you'll need to add it:

```bash
npm install @modelcontextprotocol/sdk
```

#### 2. Configure your MCP client

You need the absolute path to the built server file. Find it with:

```bash
# From the package directory
echo "$(pwd)/dist/mcp/server.js"
```

##### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "rc505mk2": {
      "command": "node",
      "args": ["/absolute/path/to/rc505mk2/dist/mcp/server.js"]
    }
  }
}
```

Restart Claude Desktop after saving.

##### Claude Code (CLI)

```bash
claude mcp add rc505mk2 node /absolute/path/to/rc505mk2/dist/mcp/server.js
```

Or add it to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "rc505mk2": {
      "command": "node",
      "args": ["/absolute/path/to/rc505mk2/dist/mcp/server.js"]
    }
  }
}
```

##### VS Code / Cursor

Add to your workspace `.vscode/mcp.json`:

```json
{
  "servers": {
    "rc505mk2": {
      "command": "node",
      "args": ["/absolute/path/to/rc505mk2/dist/mcp/server.js"]
    }
  }
}
```

##### Using npx (recommended)

```json
{
  "command": "npx",
  "args": ["-y", "rc505mk2-mcp"]
}
```

##### Using the global bin

If the package is installed globally or linked (`npm link`), you can use the bin name directly:

```json
{
  "command": "rc505mk2-mcp"
}
```

### Available Tools (21 total)

| Tool | Description |
|------|-------------|
| `list_fx_types` | List all FX types with parameter names. Filter by context (`ifx` or `tfx`). |
| `lookup_fx_params` | Get detailed parameter definitions for a specific FX (ranges, enums, sequencer info). |
| `list_fx_modules` | Browse bundled + user FX module presets. Filter by category, effect, context, tag. |
| `get_fx_module` | Get full details of a specific FX module by ID. |
| `create_fx_module` | Save a new FX module to `~/.rc505mk2/fx-modules/`. |
| `update_fx_module` | Update a user-created FX module (fails on bundled IDs). |
| `delete_fx_module` | Delete a user-created FX module (fails on bundled IDs). |
| `list_rack_presets` | Browse bundled + user rack presets. Filter by genre, tag, section. |
| `get_rack_preset` | Get full details of a specific rack preset by ID. |
| `create_rack_preset` | Save a new rack to `~/.rc505mk2/racks/`. |
| `update_rack_preset` | Update a user-created rack (fails on bundled IDs). |
| `delete_rack_preset` | Delete a user-created rack (fails on bundled IDs). |
| `resolve_rack` | Expand fxModuleId inheritance to full params (read-only). |
| `build_rack_config` | Compose FX chains or rack ID → `MemoryConfig` JSON. |
| `generate_memory` | Resolve inheritance → base64 RC0 A+B pair. |
| `save_memory_config` | Save a MemoryConfig snapshot to `~/.rc505mk2/memories/`. |
| `list_memory_configs` | Browse saved memory configs. |
| `parse_memory` | Parse RC0 XML back into a MemoryConfig JSON object. |
| `detect_device` | Scan mounted volumes for a connected RC-505mk2 device. |
| `upload_memory` | Upload RC0 files to a connected device with automatic backup and merge mode. |
| `eject_device` | Safely eject the device after upload. |

### Example Prompts

Once the server is connected, you can ask Claude things like:

- "What reverb types are available on the RC-505mk2?"
- "Build me a memory preset with a hall reverb on input FX slot A and a tape delay on slot B"
- "Show me all rack presets tagged with Hip Hop"
- "Generate RC0 files for memory slot 5 with a Lo-Fi effect on the track FX"
- "List FX modules in the dynamics category"
- "Create a new FX module for a warm tape delay"

## Architecture

```
@rc505mk2/lib
├── schemas/       Zod schemas — source of truth for all types
├── types/         Re-exported inferred types (backwards compat)
├── fx/            FX names, context-aware indexes, value enums
├── params/        40+ transform/reverse pairs, PARAM_MAP, EFFECT_NAME_MAP
├── generator/     RC0 XML generation from MemoryConfig/Rack
├── parser/        RC0 XML → MemoryConfig reverse parsing
├── config/        Merge and inheritance resolution
├── download/      ZIP generation, README text, composite builder
├── device/        USB detection, upload, backup (Node.js only)
├── template/      Embedded default RC0 template (built from source)
├── data/          fx-modules/ (33 presets), racks.json
├── mcp/           Model Context Protocol server and tool handlers
├── cli/           Command-line interface
└── node.ts        Node.js device exports
```

## Development

```bash
npm run build:template   # Embed default RC0 template
npm run build            # Build ESM + CJS outputs
npm test                 # Run tests
npm run test:watch       # Watch mode
```
