/**
 * Resolve bundled and user data directory paths for preset storage.
 */

import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BUNDLED_DATA_MARKER = join('data', 'fx-modules', '_meta.json');

/** Walk up from startDir until we find the package root (data/fx-modules/_meta.json). */
export function findPackageRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (existsSync(join(dir, BUNDLED_DATA_MARKER))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

/** Default user preset store: ~/.rc505mk2 */
export function resolveUserDataDir(): string {
  return process.env.RC505MK2_DATA_DIR ?? join(homedir(), '.rc505mk2');
}

/** Bundled read-only data at package install root (data/fx-modules, etc.). */
export function resolveBundledDataDir(): string {
  if (process.env.RC505MK2_BUNDLED_DATA) {
    return process.env.RC505MK2_BUNDLED_DATA;
  }
  const thisDir = dirname(fileURLToPath(import.meta.url));
  return findPackageRoot(thisDir);
}

export function resolveBundledFxModulesDir(): string {
  return join(resolveBundledDataDir(), 'data', 'fx-modules');
}

export function resolveUserFxModulesDir(): string {
  return join(resolveUserDataDir(), 'fx-modules');
}

export function resolveUserRacksDir(): string {
  return join(resolveUserDataDir(), 'racks');
}

export function resolveUserMemoriesDir(): string {
  return join(resolveUserDataDir(), 'memories');
}

export function resolveUserExportsDir(): string {
  return join(resolveUserDataDir(), 'exports');
}

/** Slugify a title into a kebab-case id. */
export function slugifyId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64) || 'preset';
}
