/**
 * Unified MCP server for RC-505mk2 — reference, presets, and device tools.
 *
 * See docs/UNIFIED_MCP_TOOLS.md for the full tool list.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TOOL_DEFINITIONS } from './tools.js';
import { SERVER_INSTRUCTIONS } from './instructions.js';
import {
  handleListFxTypes,
  handleLookupFxParams,
  handleParseMemory,
  handleDetectDevice,
  handleUploadMemory,
  handleEjectDevice,
  handleReadDeviceSlot,
  handleListDeviceSlots,
} from './handlers.js';
import {
  handleListFxModules,
  handleGetFxModule,
  handleCreateFxModule,
  handleUpdateFxModule,
  handleDeleteFxModule,
  handleListRackPresets,
  handleGetRackPreset,
  handleCreateRackPreset,
  handleUpdateRackPreset,
  handleDeleteRackPreset,
  handleSaveMemoryConfig,
  handleListMemoryConfigs,
  handleGetMemoryConfig,
  handleGenerateMemory,
  handleBuildRackConfig,
  handleResolveRack,
} from './handlers-preset.js';
import {
  handleExportZip,
  handleImportZip,
} from './handlers-zip.js';
import { getPackageVersion } from '../version.js';

const server = new Server(
  {
    name: 'rc505mk2',
    version: getPackageVersion(),
  },
  {
    capabilities: {
      tools: {},
    },
    instructions: SERVER_INSTRUCTIONS,
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOL_DEFINITIONS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: object;

    switch (name) {
      // Reference
      case 'list_fx_types':
        result = handleListFxTypes(args as { context?: 'ifx' | 'tfx' });
        break;
      case 'lookup_fx_params':
        result = handleLookupFxParams(args as { fx_name: string });
        break;
      // Preset browse
      case 'list_fx_modules':
        result = handleListFxModules(args ?? {});
        break;
      case 'get_fx_module':
        result = handleGetFxModule(args ?? {});
        break;
      case 'list_rack_presets':
        result = handleListRackPresets(args ?? {});
        break;
      case 'get_rack_preset':
        result = handleGetRackPreset(args ?? {});
        break;
      case 'resolve_rack':
        result = handleResolveRack(args ?? {});
        break;
      case 'list_memory_configs':
        result = handleListMemoryConfigs(args ?? {});
        break;
      case 'get_memory_config':
        result = handleGetMemoryConfig(args ?? {});
        break;
      // Preset CRUD
      case 'create_fx_module':
        result = handleCreateFxModule(args ?? {});
        break;
      case 'update_fx_module':
        result = handleUpdateFxModule(args ?? {});
        break;
      case 'delete_fx_module':
        result = handleDeleteFxModule(args ?? {});
        break;
      case 'create_rack_preset':
        result = handleCreateRackPreset(args ?? {});
        break;
      case 'update_rack_preset':
        result = handleUpdateRackPreset(args ?? {});
        break;
      case 'delete_rack_preset':
        result = handleDeleteRackPreset(args ?? {});
        break;
      case 'save_memory_config':
        result = handleSaveMemoryConfig(args ?? {});
        break;
      // Build & generate
      case 'build_rack_config':
        result = handleBuildRackConfig(args ?? {});
        break;
      case 'generate_memory':
        result = handleGenerateMemory(args ?? {});
        break;
      case 'export_zip':
        result = handleExportZip(args ?? {});
        break;
      case 'import_zip':
        result = handleImportZip(args ?? {});
        break;
      case 'parse_memory':
        result = handleParseMemory(args as { xml: string; slot_number: number });
        break;
      // Device
      case 'detect_device':
        result = handleDetectDevice();
        break;
      case 'upload_memory':
        result = handleUploadMemory(args as Parameters<typeof handleUploadMemory>[0]);
        break;
      case 'read_device_slot':
        result = handleReadDeviceSlot(args ?? {});
        break;
      case 'list_device_slots':
        result = handleListDeviceSlots(args ?? {});
        break;
      case 'eject_device':
        result = handleEjectDevice(args as { device_path?: string });
        break;
      default:
        return {
          content: [{ type: 'text' as const, text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('RC-505mk2 unified MCP server running on stdio');
}

main().catch(console.error);
