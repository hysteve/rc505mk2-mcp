/**
 * Sync docs/SKILL.md → skills/rc505mk2/SKILL.md with Agent Skills frontmatter.
 * Run: npm run sync:skills
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'docs', 'SKILL.md');
const targetDir = join(root, 'skills', 'rc505mk2');
const target = join(targetDir, 'SKILL.md');

const frontmatter = `---
name: rc505mk2
description: >-
  Use the rc505mk2 MCP server for Roland RC-505mk2 loop station workflows —
  browse FX modules and rack presets, build memory configs, generate RC0 files,
  and upload to USB. Use when the user mentions RC-505, loop station, FX racks,
  IFX/TFX, beat scatter, memory slots, or RC0 upload.
---

`;

const body = readFileSync(source, 'utf8');
mkdirSync(targetDir, { recursive: true });
writeFileSync(target, frontmatter + body);
console.log(`Synced ${source} → ${target}`);
