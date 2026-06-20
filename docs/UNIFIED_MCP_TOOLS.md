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
├── backups/                 # RC0 A+B copies before upload (timestamped per slot)
│   └── slot-05_2026-06-20T12-00-00/
└── meta.json                # storeVersion + updatedAt (touched on user writes)
```

Each preset file also carries a document-level version — see [CONCEPTS.md](./CONCEPTS.md#schema-versioning).

### Device backups

Default: `~/.rc505mk2/backups/` when `upload_memory` runs.
Override via tool arg `backup_dir`. Raw RC0 files from the device — not MemoryConfig JSON.

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
| `get_memory_config` | Fetch saved memory config by id | From `~/.rc505mk2/memories/` |

### Hardware sharing (RC0 ZIP)

| Tool | Description | Notes |
|------|-------------|-------|
| `export_zip` | RC0 ZIP (MEMORYnnnA/B.RC0) as base64 | From config, rack, or device slot; optional `write_to_disk` → `~/.rc505mk2/zips/` |
| `import_zip` | Parse RC0 ZIP → MemoryConfig | Optional `save_to_store` |

JSON preset sharing uses store files directly — copy from `~/.rc505mk2/racks/`, `memories/`, or `fx-modules/`. See [SHARING.md](./SHARING.md).

### Build & generate

| Tool | Description | Notes |
|------|-------------|-------|
| `build_rack_config` | Compose FX chains → `MemoryConfig` JSON | Does not write files |
| `generate_memory` | Resolve inheritance → base64 RC0 A+B pair | Uses embedded default template |
| `parse_memory` | RC0 XML string → `MemoryConfig` | Useful for reading device exports |

### Persist (user store)

| Tool | Description | Notes |
|------|-------------|-------|
| `create_fx_module` | Save new FX module to `~/.rc505mk2/` | Returns `file_path` |
| `update_fx_module` | Update user module | Fails on bundled IDs |
| `delete_fx_module` | Delete user module | Fails on bundled IDs |
| `create_rack_preset` | Save new rack | Returns `file_path` |
| `update_rack_preset` | Update user rack | |
| `delete_rack_preset` | Delete user rack | |
| `save_memory_config` | Save MemoryConfig snapshot | Returns `file_path` |

### Device (local USB, macOS primary)

| Tool | Description | Notes |
|------|-------------|-------|
| `detect_device` | Find RC-505mk2 USB volume | Looks for `ROLAND/DATA` |
| `read_device_slot` | Read slot → MemoryConfig | Parses A+B pair, active side |
| `list_device_slots` | List occupied slots 1–99 | Optional preset names |
| `upload_memory` | Generate + write RC0 to device slot | `merge` (default) or `overwrite` |
| `eject_device` | Safe unmount | Call after upload |

**Total: 26 tools** (reference + browse + build + persist + hardware share + device).

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

### Inspect or tweak what’s on the device

```
1. detect_device
2. list_device_slots           → browse occupied slots (optional)
3. read_device_slot            → { slot_number: 3 } → MemoryConfig
4. (edit config, or save_memory_config and share the file_path)
5. upload_memory               → { config, slot_number, mode: "merge" }  # tweak one bank
   upload_memory               → { config, slot_number, mode: "overwrite" }  # full replace
6. eject_device
```

`read_device_slot` reads both MEMORYnnnA.RC0 and MEMORYnnnB.RC0 and returns the active-side config — no manual USB file copy needed.

### Share a preset with the community

```
1. create_rack_preset / save_memory_config  → note file_path
2. Copy the JSON from ~/.rc505mk2/racks/ or memories/ (gist, forum, etc.)

Recipient:
1. Drop file into matching ~/.rc505mk2/ subfolder, OR paste JSON → create_rack_preset / save_memory_config
2. upload_memory, or export_zip for hardware-only users
```

---

## Planned tools (Phase 6 — Inspire Me)

*(Planned — not shipped.)* Creative prompt tools for rack inspiration.

---

## MCP server metadata

```json
{
  "name": "rc505mk2",
  "version": "<from package.json>"
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
