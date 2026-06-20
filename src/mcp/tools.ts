/**
 * MCP tool definitions for the unified RC-505mk2 server.
 *
 * Reference + device tools (existing) and preset browse/CRUD/generate tools (Phase 1).
 */

export const PRESET_TOOL_DEFINITIONS = [
  {
    name: 'list_fx_modules',
    description:
      'Browse FX module presets — curated single-FX configurations for building racks from scratch. ' +
      'Each result includes description (typical use), tags, and pairsWith (complementary module IDs). ' +
      'pairsWith on this response is authoritative for chain planning — do not call get_fx_module just to read pairings. ' +
      'Use for Build mode: compose chains via fxModuleId without hand-typing params. ' +
      'Call directly — do not search for tool names. Filter by category, context, usage, effect, or tag.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          description:
            'Filter by category: "dynamics", "tone", "space", "time", "transition", "performance", "character", "pitch", "modulation".',
        },
        context: {
          type: 'string',
          enum: ['ifx', 'tfx'],
          description: 'Filter to modules usable in Input FX ("ifx") or Track FX ("tfx") context.',
        },
        usage: {
          type: 'string',
          enum: ['chain', 'individual', 'both'],
          description: 'Filter by usage pattern.',
        },
        effect: {
          type: 'string',
          description: 'Filter by FX type name (e.g., "REVERB", "DELAY").',
        },
        tag: {
          type: 'string',
          description: 'Filter by tag (e.g., "transition", "dj", "vocals").',
        },
      },
    },
  },
  {
    name: 'get_fx_module',
    description:
      'Get full details of a specific FX module preset by ID, including all parameters and overrides. ' +
      'Skip when list_fx_modules already gave description, tags, and pairsWith — only call when you need full param lists or override values.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        module_id: { type: 'string', description: 'The FX module preset ID.' },
      },
      required: ['module_id'],
    },
  },
  {
    name: 'create_fx_module',
    description:
      'Create and save a new FX module preset to ~/.rc505mk2/fx-modules/. ' +
      'Use lookup_fx_params first to get valid parameter names and value ranges.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Optional kebab-case ID. Auto-generated from title if omitted.' },
        effect: { type: 'string', description: 'The FX type name.' },
        title: { type: 'string', description: 'Human-readable title.' },
        category: { type: 'string', description: 'Category name.' },
        context: {
          type: 'array',
          items: { type: 'string', enum: ['ifx', 'tfx'] },
          description: 'Where this module is usable.',
        },
        usage: { type: 'string', enum: ['chain', 'individual', 'both'], description: 'Usage pattern.' },
        description: { type: 'string', description: 'Description of the module.' },
        params: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, value: { type: 'string' } },
            required: ['name', 'value'],
          },
          description: 'The dialed-in parameter values.',
        },
        sequencer: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, value: { type: 'string' } },
            required: ['name', 'value'],
          },
          description: 'FX sequencer settings (optional).',
        },
        tags: { type: 'array', items: { type: 'string' }, description: 'Searchable tags.' },
        pairsWith: { type: 'array', items: { type: 'string' }, description: 'IDs of complementary modules.' },
      },
      required: ['effect', 'title', 'category', 'context', 'usage', 'description', 'params'],
    },
  },
  {
    name: 'update_fx_module',
    description: 'Update a user-created FX module preset. Fails for bundled module IDs.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        module_id: { type: 'string', description: 'The module ID to update.' },
        data: { type: 'object', description: 'Partial FX module data to update.' },
      },
      required: ['module_id', 'data'],
    },
  },
  {
    name: 'delete_fx_module',
    description: 'Delete a user-created FX module preset. Fails for bundled module IDs.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        module_id: { type: 'string', description: 'The module ID to delete.' },
      },
      required: ['module_id'],
    },
  },
  {
    name: 'list_rack_presets',
    description:
      'Browse bundled and user rack presets. Each result includes title, genres, section, description, and tags. ' +
      'Call directly for Adapt mode when the user wants a genre/style rack (e.g. R&B, DnB, vocals) — filter by genre, tag, or section. ' +
      'Skip this when the user asks for from-scratch / custom / greenfield — use list_fx_modules instead.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        genre: { type: 'string', description: 'Filter by genre.' },
        tag: { type: 'string', description: 'Filter by tag.' },
        section: { type: 'string', description: 'Filter by section (e.g., "percussion", "vocals").' },
      },
    },
  },
  {
    name: 'get_rack_preset',
    description: 'Get the full details of a specific rack preset by ID.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rack_id: { type: 'string', description: 'The rack preset ID.' },
      },
      required: ['rack_id'],
    },
  },
  {
    name: 'create_rack_preset',
    description:
      'Save a new rack preset to ~/.rc505mk2/racks/. ' +
      'Adapt mode: browse list_rack_presets first when adapting an existing rack. ' +
      'Build mode: skip list_rack_presets; compose from list_fx_modules fxModuleIds when user wants from-scratch. ' +
      'After list_fx_modules, call this directly — do not meta-search for tools. ' +
      'If rack id already exists, use update_rack_preset or a new title — never get_rack_preset in Build mode. ' +
      'Required: title, genres, inputFx, trackFx. ' +
      'TFX layout: bank = performance bank "A" or "B" (only two); slot = position "A"-"D" within that bank. ' +
      'Example — three TFX in bank A: { slot: "A", bank: "A", fxModuleId: "hpf-sweep", params: [] }, { slot: "B", bank: "A", ... }, { slot: "C", bank: "A", ... }. ' +
      'With fxModuleId: copy effect from list_fx_modules (or omit — server fills it); params: [] inherits module params. Do not call lookup_fx_params. ' +
      'Omit sequencer unless using 16-step seq — never send sequencer as {}. Numeric override values (e.g. TIME: 30) are coerced to strings server-side. ' +
      'IFX slots use slot A-D only (no bank field). ' +
      'BEAT_SCATTER, BEAT_REPEAT, BEAT_SHIFT, VINYL_FLICK must be TFX Slot A only (one per bank). ' +
      'tips must be objects { type: "tip"|"performance"|"how"|"warning", title, text } — not strings. ' +
      'Prefer fxModuleId from list_fx_modules with overrides; skip lookup_fx_params when using fxModuleId (params: [] is enough). ' +
      'After saving, use build_rack_config with rack_id to generate MemoryConfig for upload.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Optional ID. Auto-generated from title if omitted.' },
        title: { type: 'string', description: 'Rack title.' },
        section: { type: 'string', description: 'Section label. Defaults to "custom".' },
        genres: { type: 'array', items: { type: 'string' }, description: 'Genre tags.' },
        description: { type: 'string', description: 'Description.' },
        inputFx: {
          type: 'array',
          description:
            'Input FX chain (live input before recording). Slots A-D. Each slot: { slot, fxModuleId?, effect?, params?, label?, overrides?, sequencer? }. params defaults to [].',
        },
        trackFx: {
          type: 'array',
          description:
            'Track FX (on recorded loops). Each slot: { slot: "A"-"D", bank: "A"|"B", fxModuleId?, effect?, params?, label?, overrides?, sequencer? }. params defaults to [].',
        },
        settings: { type: 'object', description: 'Preset settings (tracks, master tempo, rec/play/rhythm).' },
        tips: {
          type: 'array',
          description:
            'Usage tips. Each item: { type: "tip"|"performance"|"how"|"warning", title: string, text: string }.',
        },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags.' },
      },
      required: ['title', 'genres', 'inputFx', 'trackFx'],
    },
  },
  {
    name: 'update_rack_preset',
    description: 'Update a user-created rack preset. Fails for bundled rack IDs.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rack_id: { type: 'string', description: 'The rack ID to update.' },
        data: { type: 'object', description: 'Partial rack data to update.' },
      },
      required: ['rack_id', 'data'],
    },
  },
  {
    name: 'delete_rack_preset',
    description: 'Delete a user-created rack preset. Fails for bundled rack IDs.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rack_id: { type: 'string', description: 'The rack ID to delete.' },
      },
      required: ['rack_id'],
    },
  },
  {
    name: 'save_memory_config',
    description: 'Save a MemoryConfig snapshot to ~/.rc505mk2/memories/.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        config: { type: 'object', description: 'A MemoryConfig JSON object.' },
        genres: { type: 'array', items: { type: 'string' }, description: 'Genre tags.' },
      },
      required: ['config'],
    },
  },
  {
    name: 'list_memory_configs',
    description: 'Browse saved memory configs from ~/.rc505mk2/memories/. Filter by genre or slot number.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        genre: { type: 'string', description: 'Filter by genre.' },
        slot_number: { type: 'number', description: 'Filter by slot number.' },
      },
    },
  },
  {
    name: 'get_memory_config',
    description: 'Get a saved MemoryConfig snapshot by id from ~/.rc505mk2/memories/.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        memory_id: { type: 'string', description: 'Saved memory config id from list_memory_configs.' },
      },
      required: ['memory_id'],
    },
  },
  {
    name: 'export_share',
    description:
      'Export a portable rc505mk2-share JSON envelope for memory, rack, or fx_module scope. ' +
      'Sources: config, device slot_number, rack_id, or fx_module_id. ' +
      'For partial exports use kind rack/fx_module with section, bank, and slot selectors. ' +
      'Set write_to_exports: true to save to ~/.rc505mk2/exports/.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        kind: { type: 'string', enum: ['memory', 'rack', 'fx_module'] },
        config: { type: 'object', description: 'MemoryConfig source for memory or partial export.' },
        slot_number: { type: 'number', description: 'Read memory from device slot (1-99).' },
        device_path: { type: 'string', description: 'Optional device mount path.' },
        rack_id: { type: 'string', description: 'Export a saved rack preset by id.' },
        fx_module_id: { type: 'string', description: 'Export a saved FX module by id.' },
        section: { type: 'string', enum: ['inputFx', 'trackFx'], description: 'FX section for partial export.' },
        bank: { type: 'string', enum: ['A', 'B', 'C', 'D'], description: 'Bank for partial export.' },
        slot: { type: 'string', enum: ['A', 'B', 'C', 'D'], description: 'Slot for fx_module partial export.' },
        source: { type: 'string', enum: ['device', 'user', 'bundled'] },
        notes: { type: 'string' },
        write_to_exports: { type: 'boolean', description: 'Write pretty JSON to ~/.rc505mk2/exports/.' },
      },
      required: ['kind'],
    },
  },
  {
    name: 'import_share',
    description:
      'Parse and validate an rc505mk2-share JSON envelope. ' +
      'Optional actions: save_to_store (memory), create_rack_preset, create_fx_module.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        envelope: { type: 'object', description: 'Parsed share envelope object.' },
        json: { type: 'string', description: 'Share envelope as JSON string.' },
        save_to_store: { type: 'boolean', description: 'Save memory payload to ~/.rc505mk2/memories/.' },
        create_rack_preset: { type: 'boolean', description: 'Save rack payload to user store.' },
        create_fx_module: { type: 'boolean', description: 'Save fx_module payload to user store.' },
        write_to_exports: { type: 'boolean', description: 'Also write validated envelope to exports dir.' },
      },
    },
  },
  {
    name: 'export_zip',
    description:
      'Generate a hardware-native RC0 ZIP (MEMORYnnnA/B.RC0) from config, rack_id + slot_number, or device slot. ' +
      'Returns base64 ZIP. Set write_to_exports: true to save to ~/.rc505mk2/exports/.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        config: { type: 'object', description: 'MemoryConfig to pack.' },
        rack_id: { type: 'string', description: 'Build from rack preset + slot_number.' },
        slot_number: { type: 'number', description: 'Slot number for rack or device read.' },
        name: { type: 'string', description: 'Optional name override when using rack_id.' },
        device_path: { type: 'string' },
        write_to_exports: { type: 'boolean' },
      },
    },
  },
  {
    name: 'import_zip',
    description:
      'Import RC0 ZIP (base64) and parse to MemoryConfig. Optional save_to_store writes to ~/.rc505mk2/memories/.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        zip_base64: { type: 'string', description: 'Base64-encoded RC0 ZIP file.' },
        save_to_store: { type: 'boolean' },
      },
      required: ['zip_base64'],
    },
  },
  {
    name: 'generate_memory',
    description:
      'Generate RC0 binary data for a memory config. Resolves fxModuleId inheritance and returns ' +
      'base64-encoded RC0 A+B pair. Use upload_memory to write to the physical device.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        config: { type: 'object', description: 'A MemoryConfig JSON object.' },
      },
      required: ['config'],
    },
  },
  {
    name: 'build_rack_config',
    description:
      'Build a MemoryConfig JSON from a rack preset ID or from FX chain descriptions. ' +
      'After create_rack_preset, pass rack_id + slot_number — do not re-specify FX chains. ' +
      'Resolves fxModuleId inheritance. Does not write files. Pass result to upload_memory or generate_memory.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rack_id: { type: 'string', description: 'Build from a rack preset ID (bundled or user).' },
        name: { type: 'string', description: 'Preset name (up to 12 ASCII characters).' },
        slot_number: { type: 'number', description: 'Memory slot number (1-99).' },
        input_fx: { type: 'array', items: { type: 'object' }, description: 'Input FX chain (when not using rack_id).' },
        track_fx: { type: 'array', items: { type: 'object' }, description: 'Track FX chain (when not using rack_id).' },
        tempo: { type: 'number', description: 'Master tempo in BPM (40.0-300.0).' },
      },
      required: ['slot_number'],
    },
  },
  {
    name: 'resolve_rack',
    description:
      'Show fully resolved params for a rack preset, expanding fxModuleId references to full params. Read-only.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rack_id: { type: 'string', description: 'The rack preset ID to resolve.' },
      },
      required: ['rack_id'],
    },
  },
];

const REFERENCE_AND_DEVICE_TOOLS = [
  {
    name: 'list_fx_types',
    description:
      'List all available FX types on the RC-505mk2 with their parameter names. ' +
      'Filter by context: "ifx" for Input FX (applied live to mic/instrument input before recording), ' +
      '"tfx" for Track FX (applied to already-recorded loops during playback — ideal for DJ-style performance). ' +
      'Track FX-only effects (BEAT_SCATTER, BEAT_REPEAT, BEAT_SHIFT, VINYL_FLICK) can ONLY be placed in TFX Slot A of each bank.\n\n' +
      'Each FX type indicates whether it supports a 16-step sequencer. When sequencer.available is true, ' +
      'the sequencer.targets array lists which main FX parameters can be modulated. ' +
      'Use lookup_fx_params for full sequencer details including step value types per target.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        context: {
          type: 'string',
          enum: ['ifx', 'tfx'],
          description: 'Filter by FX context: "ifx" for Input FX, "tfx" for Track FX. Omit for all.',
        },
      },
    },
  },
  {
    name: 'lookup_fx_params',
    description:
      'Get detailed parameter definitions for a specific FX type, including valid value ranges and enum options. ' +
      'Returns each parameter with its type (numeric with min/max range, or enum with accepted string values).\n\n' +
      'For FX that support sequencing, returns a structured "sequencer" object:\n' +
      '- sequencer.targets: Array of sequenceable parameters, each with {index, param, stepValueType}. ' +
      'TARGET is set to the index of the desired target. ' +
      'STEP 1-16 values MUST use the same value type/range as the selected target parameter ' +
      '(e.g., TRANSPOSE target TRANS has range -12 to +12, so each STEP value is -12 to +12).\n' +
      '- sequencer.controlParams: SW (ON/OFF), SYNC (ON/OFF), RETRIG (ON/OFF), SEQ RATE, SEQ MAX (1-16).\n' +
      'Use this to understand what values to pass when building presets.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        fx_name: {
          type: 'string',
          description: 'The FX type name (e.g., "DYNAMICS", "REVERB", "BEAT_SCATTER", "HPF").',
        },
      },
      required: ['fx_name'],
    },
  },
  {
    name: 'parse_memory',
    description: 'Parse an RC0 XML string back to a MemoryConfig JSON object.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        xml: {
          type: 'string',
          description: 'The RC0 XML file content.',
        },
        slot_number: {
          type: 'number',
          description: 'The memory slot number (1-99).',
        },
      },
      required: ['xml', 'slot_number'],
    },
  },
  {
    name: 'detect_device',
    description:
      'Detect a connected RC-505mk2 device. Scans mounted volumes for the ROLAND/DATA signature. ' +
      'Returns the device mount path and volume name, or a not-found message with connection instructions.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'upload_memory',
    description:
      'Upload RC0 memory files to a connected RC-505mk2 device. ' +
      'Prefer rack_id + slot_number for bundled/user racks — resolves the rack and uploads in one step. ' +
      'Alternatively pass a full MemoryConfig in config (from build_rack_config). ' +
      'Automatically detects the device, backs up existing slot files, and writes new files. ' +
      'Device must be in USB Storage mode (MENU > USB > STORAGE > CONNECT). ' +
      'Default mode "merge" preserves unchanged banks/sections; use "overwrite" for full slot replacement.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rack_id: {
          type: 'string',
          description: 'Rack preset ID (bundled or user). Use with slot_number instead of config for the common upload path.',
        },
        slot_number: {
          type: 'number',
          description: 'Memory slot number (1-99). Required when using rack_id.',
        },
        name: {
          type: 'string',
          description: 'Optional preset name override (max 12 ASCII chars). Only with rack_id.',
        },
        config: {
          type: 'object',
          description: 'Full MemoryConfig JSON. Use when not uploading from a rack_id.',
        },
        device_path: {
          type: 'string',
          description: 'Optional explicit device mount path. If omitted, auto-detects the device.',
        },
        backup_dir: {
          type: 'string',
          description: 'Directory to store backups of existing files. Defaults to "./rc505-backups".',
        },
        skip_backup: {
          type: 'boolean',
          description: 'Skip backing up existing files on the device. Defaults to false.',
        },
        mode: {
          type: 'string',
          enum: ['merge', 'overwrite'],
          description:
            'Upload mode. "merge" (default): reads existing slot data from the device and merges — ' +
            'only the FX banks and settings present in the provided config are changed, ' +
            'all other existing banks/settings are preserved. ' +
            '"overwrite": completely replaces the slot with the provided config.',
        },
      },
      required: [],
    },
  },
  {
    name: 'read_device_slot',
    description:
      'Read a memory slot from a connected RC-505mk2 device. Parses both MEMORYnnnA/B.RC0 files ' +
      'and returns the active-side MemoryConfig. Use for tweak/reupload workflows.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        slot_number: { type: 'number', description: 'Memory slot number (1-99).' },
        device_path: { type: 'string', description: 'Optional device mount path from detect_device.' },
      },
      required: ['slot_number'],
    },
  },
  {
    name: 'list_device_slots',
    description:
      'List occupied memory slots on a connected RC-505mk2 device with optional preset names.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        device_path: { type: 'string', description: 'Optional device mount path from detect_device.' },
      },
    },
  },
  {
    name: 'eject_device',
    description:
      'Safely eject a connected RC-505mk2 device. ' +
      'On macOS, unmounts all volumes and ejects the disk. On Linux, unmounts the volume. ' +
      'Use after upload_memory to safely disconnect the device.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        device_path: {
          type: 'string',
          description: 'The device mount path (from detect_device). If omitted, auto-detects the device.',
        },
      },
    },
  },
];

/** All unified MCP tools — preset browse/CRUD/generate + share + reference + device. */
export const TOOL_DEFINITIONS = [...PRESET_TOOL_DEFINITIONS, ...REFERENCE_AND_DEVICE_TOOLS];
