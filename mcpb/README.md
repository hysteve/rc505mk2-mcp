# Claude Desktop bundle (`.mcpb`)

Source files for the MCP bundle — not the MCP server itself (that lives in `src/mcp/` and builds to `dist/`).

| File | Purpose |
|------|---------|
| `manifest.json` | Extension metadata, entry point, built-in prompts |
| `icon.png` | Claude Desktop extension icon |

Build the installable bundle:

```bash
npm run build
npm run pack:mcpb
# → releases/rc505mk2-v{version}.mcpb
```

The pack script stages `dist/`, `data/`, and optional `skills/`, then runs `@anthropic-ai/mcpb pack`. Output in `releases/` is gitignored — attach to GitHub Releases.
