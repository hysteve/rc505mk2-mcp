# Unified MCP Tools & Local Storage

> Design for Phase 1: one stdio MCP server, no cloud, no API keys.
> macOS-first; bundled presets ship with the package; user creations persist locally.

---

## Design principles

1. **Bundled read-only, user read-write** — shipped presets cannot be modified by tools; user presets live in a home-directory store.
2. **No database** — JSON files on disk, same format as today’s bundled data.
3. **No auth** — all tools available to the local MCP client; trust boundary is the user’s machine.
4. **Single server** — no split between “device” and “cloud” servers.
5. **Native-bundled** — preset data ships inside the npm package; resolves relative to install path at runtime.

---

## Storage layout

### Bundled (read-only, ships with package)

Resolved at runtime from the package install directory:

```
<package-root>/
├── data/
│   └── fx-modules/          # 33 curated modules (existing tree)
│       ├── _meta.json
│       ├── dynamics/
│       │   └── gentle-comp.json
│       └── ...
└── src/data/
    └── racks.json           # ~40 rack presets (move to data/racks.json in Phase 1b)
```

**Phase 1a:** keep current paths (`data/fx-modules/`, `src/data/racks.json`).
**Phase 1b (optional cleanup):** consolidate to `data/racks.json` + update `load-racks.ts`.

### User store (read-write, created on first write)

Default: `~/.rc505mk2/` (override via env `RC505MK2_DATA_DIR`).

```
~/.rc505mk2/
├── fx-modules/              # user-created FX modules (same tree layout as bundled)
│   └── reverb/
│       └── my-custom-plate.json
├── racks/                   # user-created rack presets (one JSON per rack)
│   └── my-vocal-rack.json
├── memories/                # saved MemoryConfig snapshots
│   └── slot-03-vocal.json
└── meta.json                # optional: schema version, last migration
```

### Device backups (existing behavior)

Default: `./rc505-backups/` relative to cwd when `upload_memory` runs.
Override via tool arg `backup_dir`. Already gitignored.

### Generated RC0 output (optional explicit write)

`generate_memory` returns base64-encoded RC0 pair in the tool response (same as cloud MCP).
Optionally write to `~/.rc505mk2/output/` if `write_to_disk: true` is passed — **defer to Phase 1b** unless needed.

---

## Store API (internal, not MCP)

```typescript
interface PresetStore {
  // FX modules — bundled + user merged for reads; writes go to user only
  listFxModules(filters): FxModuleSummary[]
  getFxModule(id): FxModule | null   // searches user first, then bundled
  createFxModule(mod): FxModule      // writes to ~/.rc505mk2/fx-modules/
  updateFxModule(id, partial): FxModule
  deleteFxModule(id): void           // user store only; error if bundled id

  // Racks
  listRacks(filters): RackSummary[]
  getRack(id): Rack | null
  createRack(rack): Rack
  updateRack(id, partial): Rack
  deleteRack(id): void

  // Memory configs
  listMemoryConfigs(filters): MemoryConfigSummary[]
  getMemoryConfig(id): MemoryConfig | null
  saveMemoryConfig(config, meta): string  // returns id/filename
  deleteMemoryConfig(id): void
}
```

Reuse existing `FxModuleStore` for the fx-modules subtree; add `RackStore` and `MemoryStore` as thin JSON file wrappers.

**ID collision rule:** User IDs shadow bundled IDs on read. Bundled IDs are never overwritten.

---

## Unified tool list

### Reference (stateless, offline)

| Tool | Description | Notes |
|------|-------------|-------|
| `list_fx_types` | All FX types with param names, sequencer hints | Filter `context`: `ifx` \| `tfx` |
| `lookup_fx_params` | Full param defs, ranges, enums, sequencer targets | Call before building presets |

### Browse presets (read-only)

| Tool | Description | Notes |
|------|-------------|-------|
| `list_fx_modules` | Browse bundled + user FX modules | Filters: category, context, effect, tag |
| `get_fx_module` | Full module by ID | |
| `list_rack_presets` | Browse bundled + user racks | Filters: genre, tag, section |
| `get_rack_preset` | Full rack by ID | |
| `resolve_rack` | Expand fxModuleId inheritance to full params | Read-only inspection |
| `list_memory_configs` | Browse saved memory configs | Filters: genre, slot_number |

### Build & generate

| Tool | Description | Notes |
|------|-------------|-------|
| `build_rack_config` | Compose FX chains → `MemoryConfig` JSON | Does not write files |
| `generate_memory` | Resolve inheritance → base64 RC0 A+B pair | Uses embedded default template |
| `parse_memory` | RC0 XML string → `MemoryConfig` | Useful for reading device exports |

### Persist (user store)

| Tool | Description | Notes |
|------|-------------|-------|
| `create_fx_module` | Save new FX module to `~/.rc505mk2/` | Validates with Zod |
| `update_fx_module` | Update user module | Fails on bundled IDs |
| `delete_fx_module` | Delete user module | Fails on bundled IDs |
| `create_rack_preset` | Save new rack | |
| `update_rack_preset` | Update user rack | |
| `delete_rack_preset` | Delete user rack | |
| `save_memory_config` | Save MemoryConfig snapshot | |

### Device (local USB, macOS primary)

| Tool | Description | Notes |
|------|-------------|-------|
| `detect_device` | Find RC-505mk2 USB volume | Looks for `ROLAND/DATA` |
| `upload_memory` | Generate + write RC0 to device slot | `merge` (default) or `overwrite` |
| `eject_device` | Safe unmount | Call after upload |

**Total: 20 tools** (6 existing + 14 from former cloud MCP, minus redundant auth gates).

---

## Typical workflows

### Load a bundled rack to device slot 3

```
1. list_rack_presets          → find rack id
2. get_rack_preset            → inspect (optional)
3. build_rack_config          → MemoryConfig from rack (or rackToMemoryConfig internally)
4. detect_device
5. upload_memory              → config + slot_number, mode: merge
6. eject_device
```

### Create custom FX module and use in a rack

```
1. lookup_fx_params           → { fx_name: "REVERB" }
2. create_fx_module           → saves to ~/.rc505mk2/
3. build_rack_config          → reference fxModuleId in slots
4. generate_memory            → preview base64 (optional)
5. upload_memory
6. eject_device
```

### Inspect what’s on the device

```
1. detect_device
2. (read MEMORY003A.RC0 from device path manually, or future read_device_slot tool)
3. parse_memory
```

**Future tool (Phase 7):** `read_device_slot` — read RC0 from connected device without manual file access.

---

## Planned tools (Phase 6 — Inspire Me)

See [INSPIRE.md](./INSPIRE.md) for full spec.

| Tool | Description | Phase |
|------|-------------|-------|
| `list_genre_templates` | Bundled 5-track session blueprints from `racks.json` | 6A |
| `inspire_me` | Curated random or scored options (`mode: random \| options`) | 6A |
| `inspire_wizard` | Stateless multi-step Q&A → recommendation | 6B |
| `inspire_session` | Full session map: track roles → rack IDs + performance tip | 6B |

Slash skill: `/rc505-inspire` — bundled in `.mcpb` when Phase 6 ships.

---

## MCP server metadata

```json
{
  "name": "rc505mk2",
  "version": "0.2.0"
}
```

Single server replaces `rc505mk2-device` + `rc505mk2-cloud`.

---

## Client configuration (target)

### Cursor / VS Code

```json
{
  "mcpServers": {
    "rc505mk2": {
      "command": "npx",
      "args": ["-y", "rc505mk2-mcp"]
    }
  }
}
```

### Local development

```json
{
  "mcpServers": {
    "rc505mk2": {
      "command": "node",
      "args": ["<repo>/dist/mcp/server.js"]
    }
  }
}
```

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `RC505MK2_DATA_DIR` | `~/.rc505mk2` | User preset store root |
| `RC505MK2_BUNDLED_DATA` | (auto-detect from package) | Override bundled data path for dev |

---

## Tools explicitly NOT included

| Excluded | Reason |
|----------|--------|
| API key auth | Local-only |
| User accounts / Postgres | Local-only |
| `list_fx_modules` pagination cursors | Small dataset; filter params sufficient |
| Cloud sync | Out of scope |
| Payment / credits | Out of scope |
