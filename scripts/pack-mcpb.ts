/**
 * Build Claude Desktop .mcpb bundle → releases/rc505mk2-v{version}.mcpb
 *
 * Run: npm run pack:mcpb
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
const staging = join(root, '.mcpb-staging');
const releasesDir = join(root, 'releases');
const manifestPath = join(root, 'mcpb', 'manifest.json');
const iconPath = join(root, 'mcpb', 'icon.png');

function run(cmd: string, cwd = root) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function requirePath(path: string, label: string) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${label}: ${path}`);
  }
}

requirePath(manifestPath, 'MCP bundle manifest');
requirePath(iconPath, 'MCP bundle icon');

run('npm run build');

rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

cpSync(join(root, 'dist'), join(staging, 'dist'), { recursive: true });
cpSync(join(root, 'data'), join(staging, 'data'), { recursive: true });

cpSync(join(root, 'package.json'), join(staging, 'package.json'));
cpSync(join(root, 'package-lock.json'), join(staging, 'package-lock.json'));
run('npm ci --omit=dev', staging);

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<
  string,
  unknown
>;
manifest.version = version;
writeFileSync(join(staging, 'manifest.json'), JSON.stringify(manifest, null, 2));
cpSync(iconPath, join(staging, 'icon.png'));

mkdirSync(releasesDir, { recursive: true });

const mcpbOut = join(releasesDir, `rc505mk2-v${version}.mcpb`);
run(`npx --yes @anthropic-ai/mcpb pack . "${mcpbOut}"`, staging);

console.log(`\nDone:\n  ${mcpbOut}`);

rmSync(staging, { recursive: true, force: true });
