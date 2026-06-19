/**
 * Stage MCP server + skills and run mcpb pack → releases/rc505mk2-v{version}.mcpb
 * Also exports releases/rc505mk2-skills-v{version}.zip
 *
 * Run: npm run pack:plugin
 */

import { execSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  version: string;
};
const version = pkg.version;
const staging = join(root, 'plugin', '.staging');
const releasesDir = join(root, 'releases');

function run(cmd: string, cwd = root) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

// Build + sync skills + ensure icon exists
run('npm run build');
run('npm run sync:skills');
run('npx tsx scripts/create-icon.ts');

// Clean staging
rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

// Copy server artifacts
cpSync(join(root, 'dist'), join(staging, 'dist'), { recursive: true });
cpSync(join(root, 'data'), join(staging, 'data'), { recursive: true });
cpSync(join(root, 'skills'), join(staging, 'skills'), { recursive: true });

// Production dependencies
cpSync(join(root, 'package.json'), join(staging, 'package.json'));
cpSync(join(root, 'package-lock.json'), join(staging, 'package-lock.json'));
run('npm ci --omit=dev', staging);

// Manifest + icon
const manifest = JSON.parse(
  readFileSync(join(root, 'plugin', 'manifest.json'), 'utf8'),
) as Record<string, unknown>;
manifest.version = version;
writeFileSync(join(staging, 'manifest.json'), JSON.stringify(manifest, null, 2));

const iconSrc = join(root, 'plugin', 'assets', 'icon.png');
const iconFallback = join(root, 'public', 'assets', 'rc505-background.png');
if (existsSync(iconSrc)) {
  cpSync(iconSrc, join(staging, 'icon.png'));
} else if (existsSync(iconFallback)) {
  cpSync(iconFallback, join(staging, 'icon.png'));
}

mkdirSync(releasesDir, { recursive: true });

// MCPB bundle
const mcpbOut = join(releasesDir, `rc505mk2-v${version}.mcpb`);
run(`npx --yes @anthropic-ai/mcpb pack . "${mcpbOut}"`, staging);

// Skill ZIP (all four skills for Claude.ai upload)
const skillZip = join(releasesDir, `rc505mk2-skills-v${version}.zip`);
rmSync(skillZip, { force: true });
run(
  `zip -r "${skillZip}" rc505mk2 rc505-upload rc505-build-rack rc505-adapt-rack`,
  join(staging, 'skills'),
);

console.log(`\nDone:\n  ${mcpbOut}\n  ${skillZip}`);
