# Sharing RC-505mk2 Presets

This project supports two community-facing formats for preset exchange.

## When to use which format

| Format | Extension | Best for |
|--------|-----------|----------|
| **Share JSON** | `.rc505mk2.json` | MCP users, partial exports (one rack bank or FX slot), easy diff/review in Git |
| **RC0 ZIP** | `.zip` | Hardware-only users, full memory slot copy via USB Storage mode |

Both formats round-trip through the MCP tools `export_share` / `import_share` and `export_zip` / `import_zip`.

---

## Share JSON (`.rc505mk2.json`)

Portable envelope validated by Zod:

```json
{
  "format": "rc505mk2-share",
  "formatVersion": 1,
  "kind": "memory",
  "exportedAt": "2026-06-20T12:00:00.000Z",
  "meta": {
    "name": "Vocal Plate",
    "slotNumber": 5,
    "source": "device"
  },
  "payload": { }
}
```

### `kind` values

| kind | payload | Use case |
|------|---------|----------|
| `memory` | Full `MemoryConfig` | Entire memory slot (IFX + TFX + tracks/settings) |
| `rack` | `Rack` | One bank's FX chain (input or track section) |
| `fx_module` | `FxModule` | Single IFX/TFX slot |

### MCP workflow

**Export from device:**

```
detect_device → read_device_slot { slot_number: 5 }
export_share { kind: "memory", config: <from read>, write_to_exports: true }
```

**Export one TFX bank:**

```
export_share {
  kind: "rack",
  config: <MemoryConfig>,
  section: "trackFx",
  bank: "A",
  write_to_exports: true
}
```

**Import:**

```
import_share { json: "<file contents>", create_rack_preset: true }
```

Set `save_to_store: true` for full memory payloads. Then `upload_memory` to push back to hardware.

Files land in `~/.rc505mk2/exports/` when `write_to_exports: true`.

---

## RC0 ZIP

Contains `MEMORYnnnA.RC0`, `MEMORYnnnB.RC0`, and a short `readme.txt`.

### MCP workflow

```
export_zip { config: <MemoryConfig>, write_to_exports: true }
```

Returns `zip_base64` for agent clients; optional file on disk via `write_to_exports`.

**Manual USB install (no MCP):**

1. Put the loop station in USB Storage mode (MENU → USB → STORAGE → CONNECT).
2. Copy both RC0 files to `ROLAND/DATA/` on the device volume.
3. Eject safely before disconnecting.

**Import via MCP:**

```
import_zip { zip_base64: "...", save_to_store: true }
upload_memory { config: <from import>, slot_number: N }
```

---

## Tweak / reupload (device round-trip)

1. `detect_device`
2. `read_device_slot { slot_number: N }`
3. Edit the returned `MemoryConfig` (or share via `export_share`)
4. `upload_memory { config, slot_number: N, mode: "merge" }` — preserves unchanged banks
5. `eject_device`

Use `mode: "overwrite"` only when replacing the entire slot.

---

## Posting tips (GitHub, Reddit, forums)

- Prefer **descriptive filenames**: `vocal-plate-slot5.rc505mk2.json`
- Include **slot number**, **genre**, and **what you changed** in the post text
- For hardware users, attach the **ZIP** instead of or alongside JSON
- JSON files are safe to paste in gists; ZIPs are better as release attachments

---

## Limitations

- No automatic `fxModuleId` re-linking on import (flat params only on device read path)
- Windows eject parity is limited (same as existing `eject_device` behavior)
- Share JSON does not include the 25k-line RC0 template — only semantic preset data
