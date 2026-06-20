/**
 * Local release checklist — validates build/test/pack before merging a Release PR.
 *
 * Run: npm run prep:release
 * CI-only validation: npm run prep:release:check
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check-only');

function run(cmd: string) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function readVersion(): string {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
    version: string;
  };
  return pkg.version;
}

function assertCleanWorkingTree() {
  const status = execSync('git status --porcelain', { cwd: root, encoding: 'utf8' });
  if (status.trim()) {
    throw new Error('Working tree is not clean. Commit or stash changes before prep:release.');
  }
}

function assertChangelogEntry(version: string) {
  const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
  const heading = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\]`, 'm');
  if (!heading.test(changelog)) {
    throw new Error(
      `CHANGELOG.md has no section for ${version}. ` +
        'Wait for release-please to update the Release PR, or add the section manually there.',
    );
  }
}

function assertLockfileVersion(version: string) {
  const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')) as {
    version?: string;
    packages?: Record<string, { version?: string }>;
  };
  const lockVersion = lock.version ?? lock.packages?.['']?.version;
  if (lockVersion !== version) {
    throw new Error(
      `package-lock.json version "${lockVersion ?? 'missing'}" does not match package.json "${version}". ` +
        'Run: npm install --package-lock-only',
    );
  }
}

function assertMcpbIcon() {
  const iconPath = join(root, 'mcpb', 'icon.png');
  if (!existsSync(iconPath)) {
    throw new Error(`Missing MCP bundle icon: ${iconPath}`);
  }
}

console.log(`prep:release (${checkOnly ? 'check-only' : 'full'})`);

const version = readVersion();
console.log(`Package version: ${version}`);

if (!checkOnly) {
  assertCleanWorkingTree();
  assertChangelogEntry(version);
  assertLockfileVersion(version);
}

assertMcpbIcon();

run('npm ci');
run('npm test');
run('npm run build');

if (checkOnly) {
  console.log('\nOK — check-only passed (test + build).');
  process.exit(0);
}

run('npm run pack:mcpb');

const artifact = join(root, 'releases', `rc505mk2-v${version}.mcpb`);
if (!existsSync(artifact)) {
  throw new Error(`Expected artifact not found: ${artifact}`);
}

console.log(`\nOK — release artifact ready:\n  ${artifact}`);
console.log(
  '\nNext: merge the release-please Release PR on GitHub.\n' +
    'That merge tags v' +
    version +
    ', publishes the GitHub Release, and CI uploads the .mcpb.',
);
