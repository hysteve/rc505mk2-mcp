# Marketing Copy — RC-505mk2 Assistant (Beta)

> Internal reference for Reddit posts, GitHub Release notes, landing copy, and future marketplace listing.  
> **Audience:** RC-505mk2 owners who use Claude Desktop. **Not** developers-first (see README for dev path).

---

## One-liner

**Talk to Claude. Load FX racks on your RC-505mk2. No cloud, no JSON, no menu diving.**

---

## Elevator pitch (30 seconds)

The RC-505mk2 has deep FX — Input FX, Track FX, two banks, slot rules, 12-character names — and configuring it from the box UI is slow. **RC-505mk2 Assistant** is a free, local Claude Desktop extension that lets you browse 40+ bundled rack presets and FX modules, build custom racks in plain language, and **upload directly to your device over USB**. Everything runs on your machine. No Roland cloud account, no API keys, no subscription.

---

## Value props

| For the user | What it means |
|--------------|---------------|
| **Plain language** | *"Load the vocal plate rack to slot 5"* instead of scrolling banks and copying settings |
| **Bundled library** | 43 genre/style rack presets + 33 purpose-built FX modules (vocals, beatbox, DnB, transitions, etc.) |
| **USB upload** | Generates proper RC0 memory files and writes to the device in Storage mode |
| **Local & private** | MCP server runs locally; audio never leaves your loop station |
| **One-click install** | Download `.mcpb` → double-click → Install in Claude Desktop |

---

## What it is / what it isn't

| ✅ It is | ❌ It isn't |
|----------|------------|
| A Claude Desktop extension (MCP) | A replacement for the RC-505mk2's built-in FX UI |
| A preset library + upload tool | A DAW plugin or audio processor |
| Free beta software | Official Roland or Anthropic product |
| Works with Claude (Sonnet, etc.) | A standalone app — you need Claude Desktop |

---

## Beta positioning

**Status:** Private beta — looking for RC-505mk2 owners to try the install flow and real-world prompts.

**What's solid:** MCP tools (browse, build, upload), bundled preset library, `.mcpb` one-click install, server-side validation for TFX slot rules.

**What's early / not the focus of this release:**

- **Agent skills** (`/rc505-upload`, etc.) — exist for Cursor/Claude Code but are **under development** and not polished. Desktop users rely on natural language + MCP server instructions, not slash commands.
- **Marketplace listing** — may come after beta; for now distribution is GitHub Releases.
- **"Inspire Me"** creative prompts — planned, not shipped.

Set expectations: *helpful assistant, not magic*. Complex custom racks may take a retry; always verify on hardware before a gig.

---

## Target personas

1. **Live looper / beatboxer** — wants quick genre racks (DnB, hip-hop, ambient vocals) loaded before a set  
2. **RC-505mk2 owner new to FX** — overwhelmed by IFX vs TFX; wants guided rack ideas  
3. **Claude-curious musician** — already has Claude Desktop; looking for a practical MCP use case  
4. **Tinkerer** — will report bugs, suggest presets, stress-test upload/merge

---

## Sample prompts (copy-paste for demos)

```
Is my RC-505 connected?

List rack presets tagged for vocals.

Load the vocal plate rack to memory slot 5.

Create an RC-505 FX rack for neo-soul live vocals.

Build a breakdown rack from scratch: HPF sweep, reverse reverb swell, echo fadeout.

What Track FX only work in slot A?
```

Full list: [TEST_PROMPTS.md](./TEST_PROMPTS.md)

---

## Install (beta testers)

1. Download `rc505mk2-v0.2.0.mcpb` from [GitHub Releases](https://github.com/hysteve/rc505mk2-react/releases)
2. Double-click → **Install** in Claude Desktop
3. Connect RC-505mk2 via USB → **MENU → USB → STORAGE → CONNECT**
4. Open Claude → confirm **RC-505mk2 Assistant** tools appear
5. Try: *"List bundled rack presets"*

**Requirements:** Claude Desktop (recent version with Desktop Extensions), RC-505mk2, USB cable, macOS/Windows/Linux.

**Troubleshooting:** Run `npx rc505mk2 doctor` from a terminal (optional) or open a [GitHub issue](https://github.com/hysteve/rc505mk2-react/issues) with Claude Desktop version + OS.

**Don't trust a random `.mcpb`?** Fair — build it yourself from the open repo:

```bash
git clone https://github.com/hysteve/rc505mk2-react.git
cd rc505mk2-react
npm install && npm run build && npm run pack:plugin
# → releases/rc505mk2-v0.2.0.mcpb — install that file in Claude Desktop
```

Same bundle the Release ships; you can read the source (`src/mcp/`, `scripts/pack-plugin.ts`) before packing.

---

## FAQ (beta)

**Does this work without Claude?**  
No. You need Claude Desktop (or another MCP client for the dev path).

**Does Roland support this?**  
No. Community project, not affiliated with Roland.

**Will it brick my device?**  
It writes standard RC0 memory files to USB storage — same as copying files from Boss Tone Studio. Always back up important memories. Use merge mode when you don't want to wipe a slot.

**Does it need internet?**  
Claude needs network for the model. The MCP server and preset library are local.

**Windows?**  
Supported in theory; beta testing has been heavier on macOS. Please report platform-specific issues.

**Can I use Cursor instead?**  
Yes — developer install via `npx rc505mk2-mcp`. Skills are optional and under development.

**Is it open source?**  
Repo is on GitHub; license TBD for beta (currently private/unlicensed in package.json — decide before wide release).

**I don't want to install a random download — can I verify it?**  
Yes. Clone the repo, run `npm install && npm run build && npm run pack:plugin`, and install the `.mcpb` you built locally. No need to trust the GitHub Release binary if you'd rather audit the code first.

---

## Taglines (pick one)

- *Your RC-505mk2, in conversation.*
- *FX racks without the menu maze.*
- *Local AI assistant for loop station memory slots.*
- *From "I need a DnB vocal rack" to slot 5 — in one chat.*

---

## Visuals to capture (before posting)

- [ ] Claude Desktop with RC-505mk2 Assistant enabled (tools visible)
- [ ] Successful `upload_memory` conversation screenshot
- [ ] RC-505 showing loaded memory slot (optional hardware shot)
- [ ] 15–30s screen recording: prompt → rack listed → upload

---

## Links

| Resource | URL |
|----------|-----|
| Repo | https://github.com/hysteve/rc505mk2-react |
| Issues / feedback | https://github.com/hysteve/rc505mk2-react/issues |
| Test prompts | [TEST_PROMPTS.md](./TEST_PROMPTS.md) |
| Beta checklist | [BETA_RELEASE_CHECKLIST.md](./BETA_RELEASE_CHECKLIST.md) |
