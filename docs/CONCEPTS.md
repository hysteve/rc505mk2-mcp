# RC-505mk2 Assistant — Concepts & Workflows

Plain-language guide to how this project models your loop station, and how to talk to Claude about it.

---

## Hardware basics

The [RC-505mk2](https://www.boss.info/us/products/rc-505mk2/) stores up to **99 memory presets** (slots 1–99). Each slot is a full snapshot: Input FX, Track FX, track levels, tempo, rhythm kit, and more.

Connect via **USB Storage mode** before upload tools work:

**MENU → USB → STORAGE → CONNECT**

Each memory slot on the SD card is a pair of XML files (`MEMORY005A.RC0` + `MEMORY005B.RC0`). The device loads whichever file has the higher internal counter. This project generates both files for you.

---

## The data model (inside → out)

```
FxModule  →  Rack  →  MemoryConfig  →  RC0 files (A + B)
(reusable)   (preset)  (one slot)       (on device)
```

| Layer | What it is | Example |
|-------|------------|---------|
| **FX module** | One tuned effect — params, tags, pairing hints | `vocal-plate` (REVERB on live input) |
| **Rack** | A curated **signal chain** — IFX slots + TFX banks | "Neo-soul vocal rack" |
| **MemoryConfig** | Everything in **one memory slot** — racks + tracks + master tempo | Slot 5 on your device |
| **RC0** | Binary-ish XML the hardware reads | `MEMORY005A.RC0` |

Parameter values are **human-readable strings** (`"PLATE"`, `"1/8"`, `"-6"`) in JSON. The server converts them to device numbers when generating RC0.

---

## Input FX vs Track FX

| | **Input FX (IFX)** | **Track FX (TFX)** |
|---|-------------------|-------------------|
| **When** | Live — mic/instrument **before** recording | On **recorded loops** during playback |
| **Slots** | A, B, C, D (no bank) | Banks **A** and **B**, each with slots A–D |
| **Typical use** | Vocal chain, input comp, live reverb | DJ transitions, beat effects, loop mangling |

**Performance FX** (`BEAT_SCATTER`, `BEAT_REPEAT`, `BEAT_SHIFT`, `VINYL_FLICK`) are **Track FX only** and must sit in **TFX slot A** of their bank (one per bank).

---

## What is a "rack"?

A **rack** is **not** a memory slot. It is a **recipe** for FX chains — the part of a preset you'd reuse or share without caring about slot number, track faders, or rhythm kit.

A rack JSON object includes:

- **Metadata** — `title`, `genres`, `section` (e.g. `"vocals"`, `"percussion"`), `description`, `tags`
- **`inputFx`** — up to 4 IFX slots (`slot: "A"`–`"D"`)
- **`trackFx`** — TFX slots with **`bank: "A"` or `"B"`** and **`slot: "A"`–`"D"`**
- **`tips`** — performance notes (objects with `type`, `title`, `text` — not plain strings)
- **`settings`** — optional track/master/rec/play/rhythm defaults

Each FX slot in a rack can reference a bundled **FX module** by ID:

```json
{
  "slot": "A",
  "bank": "A",
  "fxModuleId": "hpf-sweep",
  "params": []
}
```

With `fxModuleId`, `params: []` means "inherit everything from the module." Add overrides only where you differ from the module defaults.

To turn a rack into something uploadable, the server builds a **MemoryConfig** (adds slot number, preset name, resolved params) and then RC0 files.

---

## FX modules

**FX modules** are single-effect building blocks — 33 ship with the package, and you can create your own in `~/.rc505mk2/fx-modules/`.

Each module has:

- `effect` — FX type name (`"REVERB"`, `"HPF"`, …)
- `context` — `"ifx"`, `"tfx"`, or both
- `params` — dialed-in values
- `tags`, `description`, `pairsWith` — for discovery and chain planning

Use **`list_fx_modules`** to browse; **`pairsWith` on the list response is authoritative** — you don't need `get_fx_module` just to plan a chain.

---

## Adapt vs Build (how to ask Claude)

The MCP server sends workflow rules on connect. In short:

| Mode | When | Start with |
|------|------|------------|
| **Adapt** | Genre/vibe request — *"neo-soul vocal rack"*, *"DnB drums"* | `list_rack_presets` → pick closest → tweak → upload |
| **Build** | User says **from scratch**, **custom**, **greenfield**, or **no bundled presets** | `list_fx_modules` (IFX then TFX) → `create_rack_preset` with `fxModuleId`s |

**Adapt** reuses curated racks (43 bundled). **Build** composes from modules without browsing those presets.

Typical upload after either path:

```
upload_memory { rack_id: "...", slot_number: 5 }
eject_device
```

Or use `build_rack_config` + `upload_memory` with a full `config` when you need fine control.

---

## Sharing presets

**For MCP users, sharing is usually just copying store files** — no special format required.

| What | File to copy |
|------|--------------|
| FX module | `~/.rc505mk2/fx-modules/.../*.json` |
| Rack | `~/.rc505mk2/racks/{id}.json` |
| Full memory slot | `~/.rc505mk2/memories/{id}.json` |

Recipient drops the file in the matching folder. Save tools return `file_path` for easy copy/share. See [SHARING.md](./SHARING.md).

**RC0 ZIP** (`export_zip` / `import_zip`) is for hardware-only users — copy RC0 files via USB Storage mode.

---

## Device round-trip (tweak what's on hardware)

```
detect_device
list_device_slots          → see what's occupied
read_device_slot { slot_number: 5 }
→ edit MemoryConfig or save_memory_config
upload_memory { config, slot_number: 5, mode: "merge" }   # change only what you touched
eject_device
```

- **`merge`** (default) — update only banks/sections present in your config; leave the rest of the slot alone
- **`overwrite`** — replace the entire slot

---

## Local storage

| Location | Contents |
|----------|----------|
| Package `data/` + `src/data/racks.json` | Bundled FX modules + rack presets (read-only) |
| `~/.rc505mk2/fx-modules/` | Your FX modules |
| `~/.rc505mk2/racks/` | Your rack presets |
| `~/.rc505mk2/memories/` | Saved MemoryConfig snapshots |
| `~/.rc505mk2/backups/` | RC0 A+B copies from device before upload |
| `~/.rc505mk2/zips/` | RC0 ZIP exports (hardware sharing) |

Override user data dir: `RC505MK2_DATA_DIR`.

Bundled preset IDs cannot be edited — copy with `create_rack_preset` instead.

---

## Schema versioning

On-disk JSON includes version fields so older files can be migrated as schemas evolve:

| Document | Version field | Current |
|----------|---------------|---------|
| `FxModule` | `schemaVersion` | 1 |
| `Rack` | `schemaVersion` | 1 |
| `MemoryConfig` | `version` | 1 |
| `SavedMemoryConfig` (`memories/`) | `schemaVersion` | 1 |
| `~/.rc505mk2/meta.json` | `storeVersion` | 1 |

Bundled presets without a version field are treated as **v1** on read. User saves are stamped with the current version on write. If you open a file from a newer package, you'll get a clear error asking you to upgrade.

When a schema changes in a future release: bump the version constant, add a migration step in `src/schemas/document-version.ts`, and document what changed.

---

## Tool map (26 tools)

| Category | Tools |
|----------|-------|
| Reference | `list_fx_types`, `lookup_fx_params` |
| Browse | `list_fx_modules`, `get_fx_module`, `list_rack_presets`, `get_rack_preset`, `resolve_rack`, `list_memory_configs`, `get_memory_config` |
| Build | `build_rack_config`, `generate_memory`, `parse_memory` |
| Save | `create/update/delete_fx_module`, `create/update/delete_rack_preset`, `save_memory_config` |
| Hardware share | `export_zip`, `import_zip` |
| Device | `detect_device`, `list_device_slots`, `read_device_slot`, `upload_memory`, `eject_device` |

Full API notes: [UNIFIED_MCP_TOOLS.md](./UNIFIED_MCP_TOOLS.md)

Copy-paste prompts: [TEST_PROMPTS.md](./TEST_PROMPTS.md)
