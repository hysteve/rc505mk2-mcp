import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findPackageRoot,
  resolveBundledDataDir,
  resolveBundledFxModulesDir,
} from '../src/stores/paths.js';
import { FxModuleStore } from '../src/mcp/fx-module-store.js';
import { loadBundledRacks } from '../src/data/load-racks.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('findPackageRoot', () => {
  it('finds repo root from src/stores', () => {
    const storesDir = join(repoRoot, 'src', 'stores');
    expect(findPackageRoot(storesDir)).toBe(repoRoot);
  });

  it('finds repo root from dist/stores after build', () => {
    const distStores = join(repoRoot, 'dist', 'stores');
    if (!existsSync(distStores)) return;
    expect(findPackageRoot(distStores)).toBe(repoRoot);
  });
});

describe('resolveBundledDataDir', () => {
  it('resolves bundled FX modules from repo', () => {
    const fxDir = resolveBundledFxModulesDir();
    expect(existsSync(join(fxDir, '_meta.json'))).toBe(true);

    const modules = new FxModuleStore().loadAll();
    expect(modules.length).toBeGreaterThan(20);
  });

  it('loads bundled racks from embedded JSON', () => {
    const racks = loadBundledRacks();
    expect(racks.length).toBeGreaterThan(10);
  });

  it('bundled data dir contains data/fx-modules', () => {
    const bundledDir = resolveBundledDataDir();
    expect(existsSync(join(bundledDir, 'data', 'fx-modules'))).toBe(true);
  });
});
