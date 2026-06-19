# Config System Architecture Plan

> Design plan for the @rc505mk2/lib config system: schema validation, persistence,
> inheritance, reverse transforms, and web UI integration.
>
> Created: 2026-03-16

---

## Context

The library manages three hierarchical config types that represent user-created presets
for the RC-505mk2 loop station:

```
FX Module Preset → Rack Preset → Memory Config
(single FX)        (FX bank)      (full device memory slot)
```

All config values are stored as **human-readable display strings** (e.g., `"HALL1"`,
`"-6"`, `"1/8"`) and only converted to RC0 numeric values at the moment of XML
generation. This is the correct canonical representation and will remain so.

### Current Gaps

1. **No runtime validation** — types are compile-time only; MCP handlers do ad-hoc checks
2. **No config inheritance** — Racks inline FxModule params with no back-reference
3. **No persistent user storage** — FX modules are git-committed JSON files; racks are
   a static JSON file; memory configs are transient
4. **Unidirectional transforms** — display→RC0 only; parser reverse-maps structurally
   but doesn't reverse numeric transforms (e.g., eqGain `-6` ↔ RC0 `14`)
5. **No user accounts** — no concept of ownership, public vs private presets

---

## Phase 1: Zod Schema Foundation

**Goal:** Replace TypeScript-only interfaces with Zod schemas that serve as the single
source of truth for types, runtime validation, and (later) form generation.

### 1.1 Core Schema Definitions

Create `src/schemas/` directory with:

```
src/schemas/
├── index.ts              # Re-exports all schemas and inferred types
├── fx-param.ts           # FxParamSchema, FxSlotIdSchema
├── fx-module.ts          # FxModuleSchema
├── rack.ts               # RackSchema, FxSlotDataSchema
├── memory-config.ts      # MemoryConfigSchema and sub-schemas
└── param-validators.ts   # Dynamic per-FX-type param validation
```

**FxParamSchema** — base building block:
```typescript
import { z } from 'zod';

export const FxSlotIdSchema = z.enum(['A', 'B', 'C', 'D']);
export const FxContextSchema = z.enum(['ifx', 'tfx']);

export const FxParamSchema = z.object({
  name: z.string().min(1),
  value: z.string(),
});
```

**FxModuleSchema:**
```typescript
export const FxModuleSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  effect: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  context: z.array(FxContextSchema).min(1),
  usage: z.enum(['chain', 'individual', 'both']),
  description: z.string(),
  params: z.array(FxParamSchema),
  sequencer: z.array(FxParamSchema).optional(),
  tags: z.array(z.string()).optional(),
  pairsWith: z.array(z.string()).optional(),
});

export type FxModule = z.infer<typeof FxModuleSchema>;
```

**MemoryConfigSchema** — full schema with all sub-types:
```typescript
export const MemoryFxSlotSchema = z.object({
  slot: FxSlotIdSchema,
  effect: z.string().min(1),
  label: z.string().optional(),
  enabled: z.boolean().optional(),
  params: z.array(FxParamSchema),
  sequencer: z.array(FxParamSchema).optional(),
});

export const MemoryBankSchema = z.object({
  bank: FxSlotIdSchema,
  slots: z.array(MemoryFxSlotSchema).max(4),
});

export const MemoryFxSectionSchema = z.object({
  activeBank: z.number().int().min(0).max(3).optional(),
  banks: z.array(MemoryBankSchema).max(4),
});

export const MemoryTrackSettingsSchema = z.object({
  trackNumber: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  level: z.number().int().min(0).max(200).optional(),
  pan: z.number().int().min(0).max(100).optional(),
  reverse: z.boolean().optional(),
  oneShot: z.boolean().optional(),
  fx: z.boolean().optional(),
  startMode: z.number().int().min(0).max(1).optional(),
  stopMode: z.number().int().min(0).max(2).optional(),
});

// ... MasterSettings, RecSettings, PlaySettings, RhythmSettings ...

export const MemoryConfigSchema = z.object({
  version: z.literal(1),
  slotNumber: z.number().int().min(1).max(99),
  name: z.string().max(12),
  inputFx: MemoryFxSectionSchema,
  trackFx: MemoryFxSectionSchema,
  tracks: z.array(MemoryTrackSettingsSchema).optional(),
  master: MemoryMasterSettingsSchema.optional(),
  rec: MemoryRecSettingsSchema.optional(),
  play: MemoryPlaySettingsSchema.optional(),
  rhythm: MemoryRhythmSettingsSchema.optional(),
  sourceRackId: z.string().optional(),
  genres: z.array(z.string()).optional(),
  count: z.string().regex(/^[0-9A-Fa-f]{4}$/).optional(),
});
```

### 1.2 Dynamic Parameter Validation

Build Zod refinements from existing `PARAM_MAP` and `TRANSFORM_META` so that
per-FX-type param validation doesn't duplicate the transform definitions:

```typescript
// src/schemas/param-validators.ts

import { PARAM_MAP } from '../params/param-map.js';
import { TRANSFORM_META } from '../mcp/transform-meta.js';

/**
 * Build a Zod schema that validates FxParam[] for a specific effect type.
 * Uses PARAM_MAP to know which param names are valid,
 * and TRANSFORM_META to know valid value ranges/enums.
 */
export function buildFxParamsSchema(effectName: string): z.ZodType<FxParam[]> {
  const paramDefs = PARAM_MAP[effectName];
  if (!paramDefs) return z.array(FxParamSchema); // unknown FX, pass-through

  const validNames = new Set(Object.keys(paramDefs));
  return z.array(FxParamSchema).superRefine((params, ctx) => {
    for (const [i, param] of params.entries()) {
      if (!validNames.has(param.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i, 'name'],
          message: `Unknown param "${param.name}" for ${effectName}. Valid: ${[...validNames].join(', ')}`,
        });
      }
      // Value validation via TRANSFORM_META (enum check, range check)
      // Only warn, don't block — allows forward compatibility
    }
  });
}
```

### 1.3 Validation Boundaries

Apply `.parse()` at system boundaries only — not on every internal function call:

| Boundary | Schema | Action on failure |
|----------|--------|-------------------|
| MCP tool input | Per-tool input schemas | Return `{ error }` |
| Web API route input | MemoryConfig/Rack/FxModule | 400 + Zod error details |
| Database read | Full schemas | Log warning, return data (defensive) |
| Database write | Full schemas + param validation | Reject write |
| RC0 parser output | MemoryConfigSchema | Log + return partial |
| FX module file read | FxModuleSchema | Skip invalid, log warning |

### 1.4 Type Migration

Replace existing TypeScript interfaces with Zod-inferred types:

```typescript
// src/types/memory-config.ts — becomes:
export type { MemoryConfig, MemoryFxSlot, MemoryBank, /* ... */ } from '../schemas/memory-config.js';
// Re-export for backwards compatibility (existing imports keep working)
```

The `src/types/` files become thin re-export layers. Zod schemas in `src/schemas/`
are the source of truth.

### 1.5 Deliverables — ✅ Complete (2026-03-16)

- [x] `src/schemas/` directory with all schema definitions
- [x] `buildFxParamsSchema()` dynamic validator
- [x] Validation applied at MCP handler entry points
- [x] Existing TypeScript types re-exported from Zod inferences
- [x] All existing tests passing (no behavioral change)
- [x] New schema validation tests (40 tests)

---

## Phase 2: Bidirectional Transforms

**Goal:** Add reverse transforms so RC0→display conversion is lossless, enabling
proper round-tripping from device memory and correct display values everywhere.

### 2.1 Extend ParamDef

```typescript
// src/params/param-map.ts
export interface ParamDef {
  tag: string;
  transform: (displayValue: string) => number;
  reverse?: (rc0Value: number) => string;
}
```

### 2.2 Reverse Transform Categories

Each transform function needs a corresponding reverse. The patterns:

**Enum transforms** (dynamicsType, reverbType, distType, etc.):
```typescript
// Build reverse map automatically from forward map
function reverseEnum(forwardMap: Record<string, number>): (rc0: number) => string {
  // Pick the shortest/canonical key for each numeric value
  const reverse = new Map<number, string>();
  for (const [key, val] of Object.entries(forwardMap)) {
    if (!reverse.has(val) || key.length < reverse.get(val)!.length) {
      reverse.set(val, key);
    }
  }
  return (rc0: number) => reverse.get(rc0) ?? String(rc0);
}
```

**Offset transforms** (eqGain, centered50, transposeSemi, etc.):
```typescript
// eqGain: display = rc0 - 20
export const reverseEqGain = (rc0: number): string => String(rc0 - 20);

// centered50: display = rc0 - 50
export const reverseCentered50 = (rc0: number): string => String(rc0 - 50);

// transposeSemi: display = rc0 - 12
export const reverseTransposeSemi = (rc0: number): string => String(rc0 - 12);
```

**Scaled transforms** (reverbTime, gateTime, density, etc.):
```typescript
// reverbTime: display = rc0 / 10 (as decimal string)
export const reverseReverbTime = (rc0: number): string => (rc0 / 10).toFixed(1);

// density: display = rc0 + 1
export const reverseDensity = (rc0: number): string => String(rc0 + 1);
```

**Frequency index transforms** (lowCut, highCut, eqFreq):
```typescript
// lowCut: 0=FLAT, 1-29=FREQ_VALUES[0..28]
export const reverseLowCut = (rc0: number): string =>
  rc0 === 0 ? 'FLAT' : FREQ_VALUES[rc0 - 1] ?? String(rc0);
```

**Time-based transforms** (delayTime, rollTime):
```typescript
// delayTime: 0-10=note values, 11+=ms
const REVERSE_TIME_NOTE = Object.fromEntries(
  Object.entries(TIME_NOTE_MAP).map(([k, v]) => [v, k])
);
export const reverseDelayTime = (rc0: number): string =>
  REVERSE_TIME_NOTE[rc0] ?? `${rc0 - 10}ms`;
```

**Special cases** (lofiBitDepth, lofiSampleRate, oscBotNote, etc.):
```typescript
// lofiBitDepth: 0=OFF, else display = 32 - rc0
export const reverseLofiBitDepth = (rc0: number): string =>
  rc0 === 0 ? 'OFF' : String(32 - rc0);

// oscBotNote: rc0 → note+octave string
export const reverseOscBotNote = (rc0: number): string => {
  const notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const octave = Math.floor(rc0 / 12) + 1;
  return `${notes[rc0 % 12]}${octave}`;
};
```

### 2.3 Wire Reverse Transforms into PARAM_MAP

Every entry in PARAM_MAP gets its `reverse` field populated. This is mechanical —
each transform function gets a paired reverse.

### 2.4 Update Parser

`rc0-parser.ts` currently stores raw numeric values for non-enum params. Update to
use `paramDef.reverse(rc0Value)` to produce proper display values:

```typescript
// In parseRC0 slot extraction:
const paramDef = PARAM_MAP[effectName]?.[paramName];
const displayValue = paramDef?.reverse
  ? paramDef.reverse(rc0NumericValue)
  : String(rc0NumericValue);  // fallback: raw number

fxSlot.params.push({ name: paramName, value: displayValue });
```

### 2.5 Round-Trip Test

Add a test that:
1. Takes a known FxModule with display values
2. Generates RC0 XML via `memoryConfigToRc0()`
3. Parses it back via `parseRC0()`
4. Asserts all display values match the original

### 2.6 Deliverables — ✅ Complete (2026-03-16)

- [x] Reverse transform for every transform function in `transforms.ts`
- [x] `reverse` field on every `ParamDef` in `PARAM_MAP`
- [x] Parser updated to use reverse transforms (including TARGET-aware sequencer steps)
- [x] Round-trip tests for all FX types (80 reverse + 8 integration tests)
- [x] Existing generator tests still pass (349 total tests)

---

## Phase 3: Config Inheritance Model

**Goal:** Enable FxModule → Rack → MemoryConfig inheritance so presets compose
hierarchically and the UI can show inherited vs overridden values.

### 3.1 Extend FxSlotData with Module References

```typescript
export interface FxSlotData {
  slot: FxSlotId;
  bank?: FxSlotId;
  label?: string;
  effect: string;

  /** Source FX module ID — when set, params are resolved from module + overrides */
  fxModuleId?: string;

  /** Full resolved parameter set (always complete — used for generation and display) */
  params: FxParam[];

  /**
   * Only the params that differ from the source fxModule.
   * When fxModuleId is set and overrides is empty, all values are inherited.
   * When fxModuleId is unset, overrides is unused (params is authoritative).
   */
  overrides?: FxParam[];

  sequencer?: FxParam[];
}
```

### 3.2 Extend Rack with Per-Bank Module References

```typescript
export interface RackBankConfig {
  bank: FxSlotId;
  /** Source rack preset ID for this bank (enables rack→memory inheritance) */
  sourceRackId?: string;
  slots: FxSlotData[];
}
```

### 3.3 Resolution Functions

```typescript
// src/config/resolve.ts

import type { FxParam, FxSlotData, FxModule } from '../types/index.js';

/**
 * Merge base params with overrides. Override values replace base values
 * by param name; base params not in overrides are preserved.
 */
export function mergeParams(base: FxParam[], overrides: FxParam[]): FxParam[] {
  const overrideMap = new Map(overrides.map(p => [p.name, p.value]));
  return base.map(p => ({
    name: p.name,
    value: overrideMap.get(p.name) ?? p.value,
  }));
}

/**
 * Resolve a slot's effective params given its source module.
 * Returns the full param set: module defaults + slot overrides.
 * If no module reference or module not found, returns slot.params as-is.
 */
export function resolveSlotParams(
  slot: FxSlotData,
  getModule: (id: string) => FxModule | undefined,
): FxParam[] {
  if (!slot.fxModuleId) return slot.params;
  const module = getModule(slot.fxModuleId);
  if (!module) return slot.params; // module deleted — frozen params
  return mergeParams(module.params, slot.overrides ?? []);
}

/**
 * Compute overrides: given a module and the user's desired params,
 * return only the params that differ from the module defaults.
 */
export function computeOverrides(
  moduleParams: FxParam[],
  desiredParams: FxParam[],
): FxParam[] {
  const baseMap = new Map(moduleParams.map(p => [p.name, p.value]));
  return desiredParams.filter(p => baseMap.get(p.name) !== p.value);
}
```

### 3.4 Generator Integration

`rackToMemoryConfig()` and the generator already consume `FxSlotData.params` as the
full resolved set. No generator changes needed — resolution happens before generation.

The web UI or API layer calls `resolveSlotParams()` when building the config for
generation. The stored config retains `fxModuleId` + `overrides` for inheritance
tracking.

### 3.5 Inheritance in Memory Configs

MemoryConfig can reference rack presets per-bank:

```typescript
export interface MemoryBankRef {
  bank: FxSlotId;
  /** Source rack preset ID for this bank */
  sourceRackId?: string;
  /** Per-slot FX module overrides within this bank */
  slots: MemoryFxSlot[];
}
```

When resolving for generation:
1. Look up `sourceRackId` → get Rack → get its FxSlotData for this bank
2. For each slot, resolve module params + slot overrides + memory-level overrides
3. Result: fully resolved MemoryFxSlot[] ready for RC0 generation

### 3.6 Propagation Semantics

When a source FxModule is updated:
- Rack presets referencing it via `fxModuleId` get updated params **on next resolve**
- Only overridden values are preserved
- The UI shows a diff: "Module updated — 2 params changed, your 1 override preserved"

When a source Rack is updated:
- Memory configs referencing it via `sourceRackId` get updated on next resolve
- Bank-level and memory-level overrides are preserved

### 3.7 Deliverables — ✅ Complete (2026-03-16)

- [x] `fxModuleId` and `overrides` fields on `FxSlotData` and `MemoryFxSlot`
- [x] `sourceRackId` field on `MemoryBank`
- [x] `resolveSlotParams()`, `mergeParams()`, `computeOverrides()` functions
- [x] `resolveSlot()`, `isParamOverridden()`, `recomputeSlotOverrides()` helpers
- [x] Zod schemas updated for new fields (backwards-compatible — all new fields optional)
- [x] Unit tests for inheritance resolution, override computation, propagation (40 tests)
- [x] All existing tests passing (389 total tests)

---

## Phase 4: Persistence Layer & Web App

**Goal:** Create a Next.js web application with PostgreSQL persistence for user-created
configs, OAuth authentication, and a cloud-hosted MCP server. The lib package stays
pure (no DB deps); the web app owns all persistence and API concerns.

### 4.1 Architecture: Two MCP Servers

The system splits into two focused MCP servers by responsibility:

```
@rc505mk2/lib              — schemas, transforms, generation, parsing
  └── src/mcp/             — "device" MCP (local, offline-capable)
                              tools: detect_device, upload_memory,
                                     parse_memory, eject_device

packages/web/              — Next.js app + PostgreSQL
  └── src/mcp/             — "cloud" MCP (remote, DB-backed)
                              tools: list_fx_modules, get_fx_module,
                                     create_fx_module, list_rack_presets,
                                     get_rack_preset, create_rack_preset,
                                     save_memory_config, list_memory_configs,
                                     generate_memory, build_rack_config,
                                     resolve_rack
```

MCP clients connect to both servers simultaneously:

```json
{
  "mcpServers": {
    "rc505mk2-cloud": {
      "url": "https://your-app.vercel.app/mcp"
    },
    "rc505mk2-device": {
      "command": "npx",
      "args": ["@rc505mk2/lib", "mcp"]
    }
  }
}
```

The LLM composes tools from both servers naturally — e.g., cloud `create_preset` →
lib generates RC0 → device `upload_memory`.

**Why two servers instead of one:**
- Device operations (USB detect, upload, eject) **must** run locally — cannot be remote
- Preset CRUD and browsing **should** be DB-backed — belongs with the web app
- The lib stays dependency-light and publishable (no DB, no auth, no network)
- No repository interface abstraction needed — each server accesses its data directly
- Local MCP works offline for device operations; cloud MCP requires connectivity

### 4.2 Technology Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | Next.js (App Router) | Server actions, API routes, React Server Components |
| **ORM** | Drizzle ORM | Lightweight, type-safe, SQL-first |
| **Database** | PostgreSQL (Neon free tier) | JSONB columns, concurrent access, full-text search, no vendor lock-in |
| **Auth** | NextAuth.js v5 (Auth.js) | OAuth providers (GitHub, Google), session management, mature ecosystem |
| **ID generation** | `cuid2` | Sortable, collision-resistant, URL-safe |
| **Migration** | Drizzle Kit | Schema-driven, type-safe migrations |
| **Validation** | Zod (from `@rc505mk2/lib`) | Shared schemas at DB boundaries |

**Why PostgreSQL over SQLite/Turso:**
- **JSONB columns** with indexing and in-JSON queries (`WHERE params @> ...`)
- **Concurrent web access** without write locking
- **Full-text search** via `tsvector` for preset discovery
- **Standard hosting** — Neon, Supabase, Railway all offer free tiers
- **Drizzle supports both equally** — same ORM, different driver

**Why not MongoDB:**
- Data is relational (FX modules → racks → memory configs with foreign keys)
- Schemas are well-defined (Zod), not schemaless
- Query patterns are relational ("all racks referencing this module")
- Inheritance resolution benefits from joins, not document lookups

### 4.3 Package Layout

```
packages/web/
  ├── drizzle.config.ts           # Drizzle Kit config
  ├── package.json                # next, drizzle-orm, pg, @auth/*, @rc505mk2/lib
  │
  ├── src/
  │   ├── app/
  │   │   ├── layout.tsx          # Root layout with auth provider
  │   │   ├── api/
  │   │   │   ├── auth/[...nextauth]/  # NextAuth OAuth endpoints
  │   │   │   ├── presets/        # REST API for web UI
  │   │   │   │   ├── fx-modules/
  │   │   │   │   ├── racks/
  │   │   │   │   └── memories/
  │   │   │   └── export/         # RC0 generation + download
  │   │   └── mcp/
  │   │       └── route.ts        # Remote MCP endpoint (HTTP+SSE transport)
  │   │
  │   ├── db/
  │   │   ├── index.ts            # Drizzle client + connection
  │   │   ├── schema.ts           # Drizzle PostgreSQL schema
  │   │   ├── seed.ts             # Seed public presets from lib data
  │   │   ├── migrations/         # Drizzle Kit generated migrations
  │   │   └── repos/
  │   │       ├── fx-module-repo.ts
  │   │       ├── rack-repo.ts
  │   │       └── memory-config-repo.ts
  │   │
  │   ├── auth/
  │   │   ├── config.ts           # NextAuth config (GitHub, Google providers)
  │   │   └── middleware.ts       # Route protection
  │   │
  │   ├── mcp/
  │   │   ├── server.ts           # MCP server setup (HTTP+SSE transport)
  │   │   ├── handlers.ts         # Tool handlers (import repos + @rc505mk2/lib)
  │   │   └── tools.ts            # Tool definitions for cloud MCP
  │   │
  │   └── lib/
  │       └── rc505mk2.ts         # Re-exports from @rc505mk2/lib
  │
  └── drizzle/
      └── migrations/             # SQL migration files
```

### 4.4 Database Schema

```typescript
// packages/web/src/db/schema.ts

import { pgTable, text, integer, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

// ── Users (managed by NextAuth) ─────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),              // NextAuth-generated
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// NextAuth also requires: accounts, sessions, verification_tokens tables
// These are standard and generated by @auth/drizzle-adapter

// ── FX Module Presets ───────────────────────────────────────────

export const fxModulePresets = pgTable('fx_module_presets', {
  id: text('id').primaryKey(),              // cuid2
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  effect: text('effect').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  context: jsonb('context').notNull().$type<('ifx' | 'tfx')[]>(),
  usage: text('usage', { enum: ['chain', 'individual', 'both'] }).notNull(),
  description: text('description').notNull().default(''),
  params: jsonb('params').notNull().$type<{ name: string; value: string }[]>(),
  sequencer: jsonb('sequencer').$type<{ name: string; value: string }[]>(),
  tags: jsonb('tags').$type<string[]>(),
  pairsWith: jsonb('pairs_with').$type<string[]>(),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('fx_modules_user_idx').on(table.userId),
  index('fx_modules_effect_idx').on(table.effect),
  index('fx_modules_category_idx').on(table.category),
  index('fx_modules_public_idx').on(table.isPublic),
]);

// ── Rack Presets ────────────────────────────────────────────────

export const rackPresets = pgTable('rack_presets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  section: text('section').notNull().default(''),
  genres: jsonb('genres').$type<string[]>(),
  description: text('description').notNull().default(''),
  inputFx: jsonb('input_fx').notNull(),     // FxSlotData[] (full JSON structure)
  trackFx: jsonb('track_fx').notNull(),     // FxSlotData[]
  settings: jsonb('settings'),              // PresetSettings
  tips: jsonb('tips'),                      // Tip[]
  tags: jsonb('tags').$type<string[]>(),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('racks_user_idx').on(table.userId),
  index('racks_public_idx').on(table.isPublic),
]);

// ── Memory Configs ──────────────────────────────────────────────

export const memoryConfigs = pgTable('memory_configs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slotNumber: integer('slot_number').notNull(),
  inputFx: jsonb('input_fx').notNull(),     // MemoryFxSection
  trackFx: jsonb('track_fx').notNull(),     // MemoryFxSection
  tracks: jsonb('tracks'),                  // MemoryTrackSettings[]
  master: jsonb('master'),                  // MemoryMasterSettings
  rec: jsonb('rec'),                        // MemoryRecSettings
  play: jsonb('play'),                      // MemoryPlaySettings
  rhythm: jsonb('rhythm'),                  // MemoryRhythmSettings
  sourceRackId: text('source_rack_id').references(() => rackPresets.id, { onDelete: 'set null' }),
  genres: jsonb('genres').$type<string[]>(),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('memories_user_idx').on(table.userId),
  index('memories_slot_idx').on(table.slotNumber),
  index('memories_public_idx').on(table.isPublic),
]);

// ── MCP API Keys ────────────────────────────────────────────────

export const mcpApiKeys = pgTable('mcp_api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  keyHash: text('key_hash').notNull(),
  label: text('label').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { mode: 'date' }),
});
```

### 4.5 Data Access Layer

```typescript
// packages/web/src/db/repos/fx-module-repo.ts

import { eq, and, or, inArray } from 'drizzle-orm';
import { db } from '../index.js';
import { fxModulePresets } from '../schema.js';
import { FxModuleSchema } from '@rc505mk2/lib';
import { createId } from '@paralleldrive/cuid2';

export interface FxModuleQuery {
  userId?: string;
  effect?: string;
  category?: string;
  context?: 'ifx' | 'tfx';
  tag?: string;
  isPublic?: boolean;
}

export async function listFxModules(query: FxModuleQuery) {
  const conditions = [];

  // Scope: user's own + optionally public
  if (query.userId) {
    conditions.push(
      or(eq(fxModulePresets.userId, query.userId), eq(fxModulePresets.isPublic, true))
    );
  } else {
    conditions.push(eq(fxModulePresets.isPublic, true));
  }

  if (query.effect) conditions.push(eq(fxModulePresets.effect, query.effect));
  if (query.category) conditions.push(eq(fxModulePresets.category, query.category));

  const rows = await db.select().from(fxModulePresets).where(and(...conditions));
  return rows;
}

export async function getFxModule(id: string) {
  const [row] = await db.select().from(fxModulePresets).where(eq(fxModulePresets.id, id));
  return row ?? null;
}

export async function createFxModule(userId: string, data: unknown) {
  const validated = FxModuleSchema.parse(data);
  const now = new Date();
  const [row] = await db.insert(fxModulePresets).values({
    id: createId(),
    userId,
    ...validated,
    isPublic: false,
    createdAt: now,
    updatedAt: now,
  }).returning();
  return row;
}

export async function updateFxModule(id: string, userId: string, data: unknown) {
  const validated = FxModuleSchema.partial().parse(data);
  const [row] = await db.update(fxModulePresets)
    .set({ ...validated, updatedAt: new Date() })
    .where(and(eq(fxModulePresets.id, id), eq(fxModulePresets.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteFxModule(id: string, userId: string) {
  await db.delete(fxModulePresets)
    .where(and(eq(fxModulePresets.id, id), eq(fxModulePresets.userId, userId)));
}

// Similar pattern for rack-repo.ts and memory-config-repo.ts
```

### 4.6 Authentication

**NextAuth.js v5 with OAuth providers:**

```typescript
// packages/web/src/auth/config.ts

import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '../db/index.js';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [GitHub, Google],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      return session;
    },
  },
});
```

**MCP API key authentication** for remote MCP access:

```typescript
// packages/web/src/mcp/auth.ts

import { eq } from 'drizzle-orm';
import { mcpApiKeys } from '../db/schema.js';
import { db } from '../db/index.js';
import { createHash } from 'crypto';

export async function authenticateMcpRequest(apiKey: string): Promise<string | null> {
  const keyHash = createHash('sha256').update(apiKey).digest('hex');
  const [row] = await db.select()
    .from(mcpApiKeys)
    .where(eq(mcpApiKeys.keyHash, keyHash));

  if (!row) return null;

  // Update last used timestamp (fire-and-forget)
  db.update(mcpApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(mcpApiKeys.id, row.id))
    .execute();

  return row.userId;
}
```

Users generate MCP API keys from the web UI settings page. The key is shown once,
stored as a SHA-256 hash. MCP clients send it in request headers.

### 4.7 Cloud MCP Server

The cloud MCP server runs as a Next.js route, sharing the DB layer directly:

```typescript
// packages/web/src/mcp/handlers.ts

import * as fxModuleRepo from '../db/repos/fx-module-repo.js';
import * as rackRepo from '../db/repos/rack-repo.js';
import * as memoryConfigRepo from '../db/repos/memory-config-repo.js';
import { resolveSlotParams, memoryConfigToRc0 } from '@rc505mk2/lib';

export async function handleListFxModules(args: unknown, userId: string | null) {
  return fxModuleRepo.listFxModules({
    ...args,
    userId: userId ?? undefined,
  });
}

export async function handleCreateFxModule(args: unknown, userId: string) {
  return fxModuleRepo.createFxModule(userId, args);
}

export async function handleGenerateMemory(args: unknown, userId: string) {
  // Resolve inheritance from DB, then generate RC0 using the lib
  const config = await memoryConfigRepo.resolveFullConfig(args, {
    getModule: (id) => fxModuleRepo.getFxModule(id),
    getRack: (id) => rackRepo.getRackPreset(id),
  });
  const rc0Binary = memoryConfigToRc0(config);
  return { config, rc0: Buffer.from(rc0Binary).toString('base64') };
}
```

### 4.8 Public Presets (Admin-Seeded)

The current `data/fx-modules/*.json` and `src/data/racks.json` from `@rc505mk2/lib`
become seed data for the database:

```typescript
// packages/web/src/db/seed.ts

import { loadAllFxModules, loadRacksJson } from '@rc505mk2/lib';

const SYSTEM_USER_ID = 'system';  // pre-created admin user

export async function seedPublicPresets() {
  const existingCount = await db.select({ count: count() }).from(fxModulePresets);
  if (existingCount[0].count > 0) return; // already seeded

  // Seed FX modules from @rc505mk2/lib bundled data
  const modules = loadAllFxModules();
  for (const mod of modules) {
    await createFxModule(SYSTEM_USER_ID, { ...mod, isPublic: true });
  }

  // Seed rack presets
  const racks = loadRacksJson();
  for (const rack of racks) {
    await createRackPreset(SYSTEM_USER_ID, { ...rack, isPublic: true });
  }
}
```

Public presets are read-only for non-admin users. Admin can CRUD them via web UI.

### 4.9 Lib MCP Slimming

The lib's MCP server (`@rc505mk2/lib/mcp`) is reduced to device-only tools:

| Tool | Description |
|------|-------------|
| `detect_device` | Find connected RC-505mk2 via USB |
| `upload_memory` | Write RC0 files to device memory slot |
| `parse_memory` | Parse RC0 files from device into MemoryConfig |
| `eject_device` | Safely eject the device |

Preset CRUD tools (`list_fx_modules`, `create_fx_module`, `list_rack_presets`,
`get_rack_preset`, `build_rack_config`, `generate_memory`) move to the cloud MCP
in the web app. The lib's `FxModuleStore` (file-based) remains as a read-only
fallback — it ships with bundled public presets so local generation still works
offline if needed.

### 4.10 Data Flow Summary

```
Web UI user action
  → Next.js API route → Drizzle repo → PostgreSQL
  → returns JSON → UI renders

Remote MCP tool call (Claude Desktop / Claude Code, online)
  → Next.js /mcp route → API key auth → same Drizzle repos → PostgreSQL
  → returns tool result → LLM continues

Local MCP tool call (Claude Desktop / Claude Code, always works)
  → @rc505mk2/lib MCP server → USB device operations
  → detect, upload, parse, eject

Cross-server composition (LLM orchestrates both)
  → cloud: create_preset → generate RC0 binary (base64)
  → device: upload_memory with RC0 binary → writes to USB
```

### 4.11 Deliverables

- [ ] `packages/web/` Next.js app scaffolding
- [ ] Drizzle PostgreSQL schema (`src/db/schema.ts`)
- [ ] Repository implementations (fx-module, rack, memory-config)
- [ ] NextAuth.js v5 config with GitHub + Google OAuth
- [ ] MCP API key generation and authentication
- [ ] Cloud MCP server as Next.js route (`src/app/mcp/route.ts`)
- [ ] Cloud MCP tool handlers with DB-backed data access
- [ ] Seed script for public presets from `@rc505mk2/lib` data
- [ ] Drizzle Kit migration setup
- [ ] Neon PostgreSQL connection config (dev + prod)
- [ ] Slim lib MCP to device-only tools (move preset tools to cloud MCP)

---

## Phase 5: Web UI Config Editors

**Goal:** Build the three-tier editing UI that enables users to create, browse,
compose, and export configs at every level of the hierarchy.

### 5.1 FX Module Editor

The simplest editor — creates/edits a single FX module preset.

**Form generation from schemas:**
```typescript
// Given an FX type name, generate the form fields:
function buildFxParamFields(effectName: string) {
  const paramDefs = PARAM_MAP[effectName];
  const meta = TRANSFORM_META;

  return Object.entries(paramDefs).map(([name, def]) => {
    const valueMeta = meta[def.transform.name];
    // valueMeta tells us: enum values, numeric range, display format
    return {
      name,
      tag: def.tag,
      type: valueMeta?.type ?? 'number',      // 'enum' | 'number' | 'note' | etc.
      options: valueMeta?.values,              // for enums: ['HALL1','HALL2',...]
      range: valueMeta?.range,                 // for numbers: { min: 0, max: 100 }
      default: valueMeta?.default,
    };
  });
}
```

**UI flow:**
1. Select FX type from dropdown (grouped by category)
2. Form renders parameter fields dynamically from `PARAM_MAP` + `TRANSFORM_META`
3. Each field shows valid values/range (enum dropdowns, numeric sliders, note pickers)
4. Optional: toggle sequencer panel (only for FX in `RC0_SEQ_FX_MAP`)
5. Add metadata: title, category, tags, context, usage, description
6. Save → Zod validate → DB insert → appears in user's module library

**Key principle:** Adding a new FX type or parameter to the device spec requires only
updating `PARAM_MAP`, `TRANSFORM_META`, and `transforms.ts`. Zero UI code changes.

### 5.2 Rack Editor

Composes FX modules into a bank configuration.

**UI structure:**
```
┌─────────────────────────────────────────────┐
│ Rack: "Vocal Processing"                     │
│                                              │
│  Input FX                                    │
│  ┌──────────────────────────────────────────┐│
│  │ Bank A                                   ││
│  │  Slot A: [Gentle Comp] (from module)     ││
│  │    TYPE: NATURALCOMP (inherited)         ││
│  │    DYNAMICS: -3 (overridden: was -6)     ││
│  │  Slot B: [Hall Wash] (from module)       ││
│  │    TIME: 3.0 (overridden: was 5.0)       ││
│  │  Slot C: (empty)                         ││
│  │  Slot D: (empty)                         ││
│  └──────────────────────────────────────────┘│
│  Bank B / C / D tabs...                      │
│                                              │
│  Track FX                                    │
│  ┌──────────────────────────────────────────┐│
│  │ (same 4-bank × 4-slot layout)            ││
│  └──────────────────────────────────────────┘│
│                                              │
│  [Save Rack] [Export as Memory Config]       │
└─────────────────────────────────────────────┘
```

**Per-slot interactions:**
- **Browse modules:** Opens a drawer/modal listing user's saved FxModules, filtered
  by effect type compatible with the slot context (ifx/tfx)
- **Assign module:** Sets `fxModuleId`, populates `params` from module, clears overrides
- **Override param:** User edits an inherited value → value added to `overrides[]`,
  displayed in bold/accent color. Can revert individual overrides.
- **Manual entry:** No module reference — user selects FX type and dials all params
  directly (same form as FX Module Editor, inline)

### 5.3 Memory Config Editor

Extends the existing MemoryBuilderPanel with full editing capabilities.

**Additions to current design:**
1. Per-bank: assign a Rack preset (existing) or compose from individual modules
2. Non-FX settings panel: tracks (level, pan, reverse, etc.), master (tempo),
   rec settings, play settings, rhythm settings
3. Preview panel: shows all resolved values in a read-only tree
4. Export: download ZIP, upload to device, or save to DB

**Settings forms:** Also generated from Zod schemas:
```typescript
// MemoryTrackSettingsSchema → form with:
// - Track number selector (1-5)
// - Level slider (0-200)
// - Pan slider (0-100, center=50)
// - Reverse toggle
// - OneShot toggle
// - FX on/off toggle
// - Start mode dropdown (IMMEDIATE, FADE)
// - Stop mode dropdown (IMMEDIATE, FADE, LOOP)
```

### 5.4 Browse & Discover

The web UI needs preset browsing at every level:

**FX Module Browser:**
- Filter by: effect type, category, context (ifx/tfx), usage, tags
- Sort by: newest, most used, alphabetical
- Scope: user's own + public modules
- Actions: assign to rack slot, view details, edit, clone, delete

**Rack Browser:**
- Filter by: genre, FX types used, tags
- Sort by: newest, most used, alphabetical
- Scope: user's own + public racks
- Actions: assign to memory bank, view details, edit, clone, delete

**Memory Config Browser:**
- Filter by: genre, slot number range
- Sort by: newest, slot number
- Actions: download, upload to device, edit, clone, delete

### 5.5 Deliverables

- [ ] FX Module Editor component with schema-driven form generation
- [ ] Rack Editor component with module assignment and override UI
- [ ] Memory Config Editor (extended MemoryBuilderPanel)
- [ ] Preset browser components for all three levels
- [ ] User account creation and authentication
- [ ] Public preset admin interface

---

## Phase 6: MCP Deployment & Cross-Server Workflows

**Goal:** Deploy the cloud MCP server, configure cross-server workflows, and ensure
seamless composition between the cloud (preset CRUD) and device (USB operations)
MCP servers.

### 6.1 Cloud MCP Tool Definitions

All preset management tools live in the cloud MCP (web app). These were moved from
`@rc505mk2/lib/mcp/` in Phase 4.

| Tool | Description | Auth required |
|------|-------------|---------------|
| `list_fx_modules` | Query user's + public FX module presets | No (public only if unauthed) |
| `get_fx_module` | Get a single FX module by ID | No |
| `create_fx_module` | Save a new FX module preset | Yes |
| `update_fx_module` | Update an existing FX module | Yes (owner only) |
| `delete_fx_module` | Delete an FX module | Yes (owner only) |
| `list_rack_presets` | Query user's + public rack presets | No |
| `get_rack_preset` | Get a single rack by ID | No |
| `create_rack_preset` | Save a new rack preset | Yes |
| `update_rack_preset` | Update an existing rack | Yes (owner only) |
| `delete_rack_preset` | Delete a rack preset | Yes (owner only) |
| `save_memory_config` | Save a memory config to user's library | Yes |
| `list_memory_configs` | Browse saved memory configs | No |
| `generate_memory` | Resolve inheritance + generate RC0 binary | Yes |
| `build_rack_config` | Compose FX modules into a rack config | Yes |
| `resolve_rack` | Show fully resolved params (with inheritance) | No |

### 6.2 Device MCP Tool Definitions

The lib's MCP server retains device-only tools (unchanged from current):

| Tool | Description |
|------|-------------|
| `detect_device` | Find connected RC-505mk2 via USB |
| `upload_memory` | Write RC0 files to a device memory slot |
| `parse_memory` | Parse RC0 files from device into MemoryConfig |
| `eject_device` | Safely eject the connected device |

### 6.3 Cross-Server Workflow Examples

The LLM sees tools from both servers and composes them naturally:

**"Create a reverb preset and upload it to slot 42":**
1. `rc505mk2-cloud.create_fx_module` → saves to DB, returns module
2. `rc505mk2-cloud.build_rack_config` → composes into rack
3. `rc505mk2-cloud.generate_memory` → resolves + generates RC0 (base64)
4. `rc505mk2-device.upload_memory` → writes RC0 to USB device slot 42

**"Show me what's on my device slot 10":**
1. `rc505mk2-device.detect_device` → finds device path
2. `rc505mk2-device.parse_memory` → reads + parses slot 10 → MemoryConfig JSON

**"Save what's on my device to my library":**
1. `rc505mk2-device.parse_memory` → MemoryConfig JSON
2. `rc505mk2-cloud.save_memory_config` → persists to DB

### 6.4 MCP Authentication Flow

```
MCP Client config includes API key
  → Request to cloud MCP endpoint with Authorization header
  → Next.js route extracts API key
  → SHA-256 hash → lookup mcp_api_keys table → resolve userId
  → All tool handlers receive userId for scoped DB access
  → Unauthenticated: read-only access to public presets only
```

Users generate API keys from the web UI settings page. The key is displayed once
at creation time, stored as a SHA-256 hash in the database.

### 6.5 Tool Description Optimization

Cloud MCP tool descriptions are written to guide LLM tool selection:

```typescript
{
  name: 'generate_memory',
  description: `Generate RC0 binary data for a memory config. Resolves all
    inheritance (fxModuleId → module params, sourceRackId → rack config)
    and produces base64-encoded RC0 data ready for upload_memory.
    Requires authentication. Use detect_device + upload_memory from the
    rc505mk2-device server to write the result to the physical device.`,
  inputSchema: GenerateMemoryInputSchema,
}
```

### 6.6 Deliverables

- [ ] Cloud MCP endpoint deployed with web app
- [ ] All cloud MCP tool definitions with LLM-optimized descriptions
- [ ] Cross-server workflow documentation
- [ ] MCP client config examples (Claude Desktop, Claude Code)
- [ ] API key management UI (generate, revoke, list)
- [ ] Rate limiting on cloud MCP endpoint

---

## Implementation Order & Dependencies

```
Phase 1: Zod Schemas ──────────────┐
                                    ├──→ Phase 3: Inheritance ─┐
Phase 2: Reverse Transforms ───────┘                           │
                                                                ↓
Phase 4: Persistence + Web App ────────────────────────→ Phase 5: Web UI
  (Next.js, PostgreSQL, Auth,                              (editors, browsers,
   cloud MCP, seed data,                                    preset discovery)
   slim lib MCP)                                               │
                                                                ↓
                                                        Phase 6: MCP Deploy
                                                          (cross-server workflows,
                                                           API key mgmt, docs)
```

- **Phases 1–3:** ✅ Complete. Zod schemas, reverse transforms, and inheritance
  resolution are all implemented in `@rc505mk2/lib`.
- **Phase 4** depends on Phases 1 + 3 (Zod validation at DB boundaries, inheritance
  types for DB columns). This is the next phase to implement. Creates `packages/web/`.
- **Phase 5** depends on Phase 4 (web app scaffold, DB, auth must exist for editors)
- **Phase 6** depends on Phase 4 + 5 (cloud MCP is deployed with the web app,
  cross-server workflows need both servers operational)

### Estimated Scope

| Phase | Package | New files | Modified files | Key dependency adds |
|-------|---------|-----------|----------------|---------------------|
| 1 ✅ | lib | ~6 schema files | types/, MCP handlers | zod |
| 2 ✅ | lib | reverse-transforms.ts | transforms.ts, param-map.ts, parser | none |
| 3 ✅ | lib | resolve.ts | rack.ts, memory-config.ts, schemas | none |
| 4 | **web (new)** | ~15 files (app scaffold, db, auth, mcp) | lib: slim MCP handlers | next, drizzle-orm, pg, @auth/*, cuid2 |
| 5 | web | ~8 components | existing web app pages | none (uses existing shadcn) |
| 6 | web + lib | ~3 files (config, docs) | cloud MCP tools, lib MCP tools | none |

---

## Design Principles

1. **Display values are canonical.** RC0 numerics are an export encoding, not storage format.

2. **PARAM_MAP is the single source of truth** for parameter names, tags, transforms,
   and (with Phase 2) reverse transforms. Zod schemas, form fields, and validation
   are all derived from it — never duplicated.

3. **Validate at boundaries, trust internally.** Zod `.parse()` at API/MCP/DB edges.
   Internal functions pass typed data without re-validation.

4. **Inheritance is opt-in.** `fxModuleId` is optional. Standalone presets with no
   module reference work exactly as they do today.

5. **Public presets are admin-seeded.** The existing JSON data becomes seed data for
   the `PUBLIC` admin user. User-created presets are private by default.

6. **Schema-driven UI.** Adding a new FX type requires only data changes to PARAM_MAP
   and transforms — zero new UI code.
