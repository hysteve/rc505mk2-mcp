/**
 * Runtime file-based store for FX module presets.
 *
 * Scans a directory tree of individual JSON files (one per module, organized
 * into subdirectories by FX name) and supports reading, listing, and writing
 * new modules. The MCP server uses this to browse curated modules and persist
 * LM-generated ones without editing a monolithic file.
 *
 * Directory layout:
 *   data/fx-modules/
 *     _meta.json
 *     dynamics/
 *       gentle-comp.json
 *       hard-comp.json
 *     reverb/
 *       hall-wash.json
 *       vocal-plate.json
 *     ...
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { FxModule } from '../types/rack.js';
import { resolveBundledFxModulesDir } from '../stores/paths.js';

const META_FILE = '_meta.json';

/**
 * Recursively collect all .json files from a directory tree,
 * excluding _meta.json at the root level.
 */
function collectJsonFiles(dir: string): string[] {
  const results: string[] = [];

  for (const entry of readdirSync(dir)) {
    if (entry === META_FILE) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectJsonFiles(full));
    } else if (entry.endsWith('.json')) {
      results.push(full);
    }
  }

  return results.sort();
}

export class FxModuleStore {
  private dataDir: string;
  private cache: FxModule[] | null = null;
  private meta: Record<string, unknown> | null = null;

  constructor(dataDir?: string) {
    this.dataDir = dataDir ?? resolveBundledFxModulesDir();
  }

  /** Ensure the data directory exists. */
  private ensureDir(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /** Invalidate the in-memory cache (call after writes). */
  invalidate(): void {
    this.cache = null;
    this.meta = null;
  }

  /** Load and return the _meta.json content. */
  getMeta(): Record<string, unknown> {
    if (this.meta) return this.meta;
    const metaPath = join(this.dataDir, META_FILE);
    if (existsSync(metaPath)) {
      this.meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
    } else {
      this.meta = {};
    }
    return this.meta!;
  }

  /** Load all modules from the data directory tree. */
  loadAll(): FxModule[] {
    if (this.cache) return this.cache;

    this.ensureDir();

    const files = collectJsonFiles(this.dataDir);
    this.cache = files.map(f => {
      const content = readFileSync(f, 'utf-8');
      return JSON.parse(content) as FxModule;
    });

    return this.cache;
  }

  /** Find a module by ID. */
  getById(id: string): FxModule | undefined {
    return this.loadAll().find(m => m.id === id);
  }

  /**
   * Derive the subdirectory name from the effect name.
   * e.g., "GATE REVERB" → "gate-reverb", "DYNAMICS" → "dynamics"
   */
  private effectToFolder(effect: string): string {
    return effect.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  /** Write a module to disk as an individual JSON file under its effect folder. */
  write(mod: FxModule): string {
    const folder = join(this.dataDir, this.effectToFolder(mod.effect));
    mkdirSync(folder, { recursive: true });
    const filePath = join(folder, `${mod.id}.json`);
    writeFileSync(filePath, JSON.stringify(mod, null, 2) + '\n', 'utf-8');
    this.invalidate();
    return filePath;
  }

  /** Check if a module ID already exists anywhere in the tree. */
  exists(id: string): boolean {
    return this.loadAll().some(m => m.id === id);
  }

  /** Update an existing module in place. */
  update(id: string, partial: Partial<FxModule>): FxModule | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...partial, id: existing.id };
    this.write(updated);
    return updated;
  }

  /** Delete a module by ID. Returns true if deleted. */
  delete(id: string): boolean {
    const mod = this.getById(id);
    if (!mod) return false;
    const filePath = join(this.dataDir, this.effectToFolder(mod.effect), `${mod.id}.json`);
    if (!existsSync(filePath)) return false;
    unlinkSync(filePath);
    this.invalidate();
    return true;
  }

  /** Return the data directory path. */
  getDataDir(): string {
    return this.dataDir;
  }
}
