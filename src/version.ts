/**
 * Read package version from the install root (package.json next to data/).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findPackageRoot } from './stores/paths.js';

export function getPackageVersion(): string {
  const root = findPackageRoot(dirname(fileURLToPath(import.meta.url)));
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
    version?: string;
  };
  return pkg.version ?? '0.0.0';
}
