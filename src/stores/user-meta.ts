/**
 * ~/.rc505mk2/meta.json — store-level version tracking.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { resolveUserDataDir } from './paths.js';

/** Bump when the on-disk layout under ~/.rc505mk2/ changes (new subdirs, renames). */
export const USER_STORE_VERSION = 1;

export interface UserStoreMeta {
  storeVersion: number;
  updatedAt: string;
}

const META_FILENAME = 'meta.json';

export function resolveUserMetaPath(): string {
  return join(resolveUserDataDir(), META_FILENAME);
}

export function readUserStoreMeta(): UserStoreMeta | null {
  const path = resolveUserMetaPath();
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as UserStoreMeta;
  } catch {
    return null;
  }
}

/** Write or refresh store meta after a user preset write. */
export function touchUserStoreMeta(): UserStoreMeta {
  const dir = resolveUserDataDir();
  mkdirSync(dir, { recursive: true });

  const meta: UserStoreMeta = {
    storeVersion: USER_STORE_VERSION,
    updatedAt: new Date().toISOString(),
  };

  writeFileSync(resolveUserMetaPath(), JSON.stringify(meta, null, 2) + '\n', 'utf-8');
  return meta;
}
