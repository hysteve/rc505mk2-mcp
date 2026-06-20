# Sharing RC-505mk2 Presets

Presets use the same JSON schemas everywhere — bundled data, user store, and files you share with others. No separate share format.

---

## MCP users: copy store files

| Share this | Copy from |
|------------|-----------|
| FX module | `~/.rc505mk2/fx-modules/{category}/{id}.json` |
| Rack | `~/.rc505mk2/racks/{id}.json` |
| Full memory slot | `~/.rc505mk2/memories/{id}.json` |

**Export:** After `create_rack_preset`, `create_fx_module`, or `save_memory_config`, the tool response includes `file_path` — copy that file.

**Import:** Drop the JSON into the matching folder on the recipient's machine. The next `list_rack_presets` / `list_fx_modules` / `list_memory_configs` picks it up automatically.

Or paste JSON to Claude and ask to create via the appropriate save tool.

Each file carries `schemaVersion` (or `version` for MemoryConfig) for forward compatibility — see [CONCEPTS.md](./CONCEPTS.md#schema-versioning).

---

## Hardware-only users: RC0 ZIP

For people without MCP — copy RC0 files via USB Storage mode:

```
export_zip { config, write_to_disk: true }   → ~/.rc505mk2/zips/
```

ZIP contains `MEMORYnnnA.RC0`, `MEMORYnnnB.RC0`, and `readme.txt`.

**Manual USB install:**

1. Put the loop station in USB Storage mode (MENU → USB → STORAGE → CONNECT).
2. Copy both RC0 files to `ROLAND/DATA/` on the device volume.
3. Eject safely before disconnecting.

**Import via MCP:**

```
import_zip { zip_base64: "...", save_to_store: true }
upload_memory { config, slot_number: N }
```

---

## Extract partial chains from a memory slot

Internal helpers (not MCP tools) can derive a rack or FX module from a saved memory config — useful when building save tools or CLI features:

- `extractRackFromMemory(config, section, bank)` → `Rack`
- `extractFxModuleFromMemory(config, section, bank, slot)` → `FxModule`

Save the result with `create_rack_preset` or `create_fx_module`, then share the store file.

---

## Device round-trip

```
detect_device
read_device_slot { slot_number: N }
save_memory_config { config }          → file_path under memories/
upload_memory { config, slot_number: N, mode: "merge" }
eject_device
```

- **`merge`** — update only banks/sections in your config; preserve the rest
- **`overwrite`** — replace the entire slot

Upload backs up existing RC0 files to `~/.rc505mk2/backups/` before writing.

---

## Posting tips

- Use descriptive filenames: `neo-soul-vocal-rack.json`
- Include slot number, genre, and what changed in the post text
- For hardware users, attach RC0 ZIP instead of JSON
- JSON files work well in gists or zip attachments
