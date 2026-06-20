/**
 * Write RC0 ZIP exports to ~/.rc505mk2/zips/
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveUserZipsDir } from '../stores/paths.js';
import { touchUserStoreMeta } from '../stores/user-meta.js';

export function writeZipExport(filename: string, data: Uint8Array, zipsDir?: string): string {
  const dir = zipsDir ?? resolveUserZipsDir();
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, filename);
  writeFileSync(filePath, data);
  touchUserStoreMeta();
  return filePath;
}
