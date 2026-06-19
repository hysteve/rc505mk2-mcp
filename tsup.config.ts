import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      browser: 'src/browser.ts',
      node: 'src/node.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['@modelcontextprotocol/sdk'],
  },
  {
    entry: {
      'cli/generate-memories': 'src/cli/generate-memories.ts',
      'mcp/server': 'src/mcp/server.ts',
    },
    format: ['esm'],
    dts: false,
    sourcemap: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
    external: ['@modelcontextprotocol/sdk'],
  },
]);
