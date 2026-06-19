/**
 * Unified preset store — merges bundled read-only data with user-writable store.
 *
 * User IDs shadow bundled IDs on read. Bundled presets cannot be modified or deleted.
 */

import type { FxModule } from '../schemas/fx-module.js';
import type { Rack } from '../schemas/rack.js';
import type { MemoryConfig } from '../schemas/memory-config.js';
import { FxModuleSchema } from '../schemas/fx-module.js';
import { RackSchema } from '../schemas/rack.js';
import { FxModuleStore } from '../mcp/fx-module-store.js';
import { loadBundledRacks } from '../data/load-racks.js';
import { RackStore } from './rack-store.js';
import { MemoryStore, type MemoryConfigSummary, type SavedMemoryConfig } from './memory-store.js';
import {
  resolveBundledFxModulesDir,
  resolveUserFxModulesDir,
  slugifyId,
} from './paths.js';

export interface FxModuleFilters {
  category?: string;
  context?: 'ifx' | 'tfx';
  usage?: 'chain' | 'individual' | 'both';
  effect?: string;
  tag?: string;
}

export interface FxModuleSummary {
  id: string;
  title: string;
  effect: string;
  category: string;
  context: string[];
  usage: string;
  description: string;
  tags?: string[];
  pairsWith?: string[];
  source: 'bundled' | 'user';
}

export interface RackFilters {
  genre?: string;
  tag?: string;
  section?: string;
}

export interface RackSummary {
  id: string;
  title: string;
  section: string;
  genres: string[];
  description: string;
  tags?: string[];
  source: 'bundled' | 'user';
}

export interface MemoryConfigFilters {
  genre?: string;
  slotNumber?: number;
}

export class PresetStore {
  private bundledFx: FxModuleStore;
  private userFx: FxModuleStore;
  private userRacks: RackStore;
  private memories: MemoryStore;
  private bundledRackIds: Set<string>;

  constructor(options?: {
    bundledFxDir?: string;
    userFxDir?: string;
    userRacksDir?: string;
    userMemoriesDir?: string;
  }) {
    this.bundledFx = new FxModuleStore(options?.bundledFxDir ?? resolveBundledFxModulesDir());
    this.userFx = new FxModuleStore(options?.userFxDir ?? resolveUserFxModulesDir());
    this.userRacks = new RackStore(options?.userRacksDir);
    this.memories = new MemoryStore(options?.userMemoriesDir);
    this.bundledRackIds = new Set(loadBundledRacks().map(r => r.id));
  }

  // ── FX Modules ───────────────────────────────────────────────────

  listFxModules(filters: FxModuleFilters = {}): FxModuleSummary[] {
    const userIds = new Set(this.userFx.loadAll().map(m => m.id));
    const merged = [
      ...this.userFx.loadAll().map(m => ({ mod: m, source: 'user' as const })),
      ...this.bundledFx.loadAll()
        .filter(m => !userIds.has(m.id))
        .map(m => ({ mod: m, source: 'bundled' as const })),
    ];

    const filtered = merged.filter(({ mod }) => {
      if (filters.category && mod.category !== filters.category) return false;
      if (filters.context && !mod.context.includes(filters.context)) return false;
      if (filters.usage && mod.usage !== filters.usage) return false;
      if (filters.effect && mod.effect.toUpperCase() !== filters.effect.toUpperCase()) return false;
      if (filters.tag && !mod.tags?.some(t => t.toLowerCase() === filters.tag!.toLowerCase())) return false;
      return true;
    });

    return filtered.map(({ mod, source }) => ({
      id: mod.id,
      title: mod.title,
      effect: mod.effect,
      category: mod.category,
      context: mod.context,
      usage: mod.usage,
      description: mod.description,
      tags: mod.tags,
      pairsWith: mod.pairsWith,
      source,
    }));
  }

  getFxModule(id: string): (FxModule & { source: 'bundled' | 'user' }) | null {
    const user = this.userFx.getById(id);
    if (user) return { ...user, source: 'user' };
    const bundled = this.bundledFx.getById(id);
    if (bundled) return { ...bundled, source: 'bundled' };
    return null;
  }

  isBundledFxModule(id: string): boolean {
    return this.bundledFx.exists(id) && !this.userFx.exists(id);
  }

  createFxModule(data: Omit<FxModule, 'id'> & { id?: string }): FxModule {
    const id = data.id ?? slugifyId(data.title);
    if (this.bundledFx.exists(id)) {
      throw new Error(`Cannot create module with bundled ID "${id}". Choose a different id.`);
    }
    if (this.userFx.exists(id)) {
      throw new Error(`FX module "${id}" already exists.`);
    }
    const mod = FxModuleSchema.parse({ ...data, id });
    this.userFx.write(mod);
    return mod;
  }

  updateFxModule(id: string, partial: Partial<FxModule>): FxModule {
    if (this.isBundledFxModule(id)) {
      throw new Error(`Cannot update bundled FX module "${id}". Create a copy with create_fx_module instead.`);
    }
    const updated = this.userFx.update(id, partial);
    if (!updated) {
      throw new Error(`FX module not found: ${id}.`);
    }
    return updated;
  }

  deleteFxModule(id: string): void {
    if (this.isBundledFxModule(id)) {
      throw new Error(`Cannot delete bundled FX module "${id}".`);
    }
    if (!this.userFx.delete(id)) {
      throw new Error(`FX module not found: ${id}.`);
    }
  }

  /** Lookup helper for inheritance resolution — user shadows bundled. */
  getModuleById(id: string): FxModule | undefined {
    return this.userFx.getById(id) ?? this.bundledFx.getById(id);
  }

  // ── Racks ────────────────────────────────────────────────────────

  listRacks(filters: RackFilters = {}): RackSummary[] {
    const userIds = new Set(this.userRacks.loadAll().map(r => r.id));
    const merged = [
      ...this.userRacks.loadAll().map(r => ({ rack: r, source: 'user' as const })),
      ...loadBundledRacks()
        .filter(r => !userIds.has(r.id))
        .map(r => ({ rack: r, source: 'bundled' as const })),
    ];

    const filtered = merged.filter(({ rack }) => {
      if (filters.section && rack.section !== filters.section) return false;
      if (filters.genre && !rack.genres.some(g => g.toLowerCase() === filters.genre!.toLowerCase())) return false;
      if (filters.tag && !rack.tags?.some(t => t.toLowerCase() === filters.tag!.toLowerCase())) return false;
      return true;
    });

    return filtered.map(({ rack, source }) => ({
      id: rack.id,
      title: rack.title,
      section: rack.section,
      genres: rack.genres,
      description: rack.description,
      tags: rack.tags,
      source,
    }));
  }

  getRack(id: string): (Rack & { source: 'bundled' | 'user' }) | null {
    const user = this.userRacks.getById(id);
    if (user) return { ...user, source: 'user' };
    const bundled = loadBundledRacks().find(r => r.id === id);
    if (bundled) return { ...bundled, source: 'bundled' };
    return null;
  }

  isBundledRack(id: string): boolean {
    return this.bundledRackIds.has(id) && !this.userRacks.exists(id);
  }

  createRack(data: Omit<Rack, 'id'> & { id?: string }): Rack {
    const id = data.id ?? slugifyId(data.title);
    if (this.bundledRackIds.has(id)) {
      throw new Error(`Cannot create rack with bundled ID "${id}". Choose a different id.`);
    }
    if (this.userRacks.exists(id)) {
      throw new Error(
        `Rack "${id}" already exists. Use update_rack_preset with rack_id "${id}" or choose a new title/id.`,
      );
    }
    const rack = RackSchema.parse({ ...data, id });
    this.userRacks.write(rack);
    return rack;
  }

  updateRack(id: string, partial: Partial<Rack>): Rack {
    if (this.isBundledRack(id)) {
      throw new Error(`Cannot update bundled rack "${id}". Create a copy with create_rack_preset instead.`);
    }
    const existing = this.userRacks.getById(id);
    if (!existing) {
      throw new Error(`Rack not found: ${id}.`);
    }
    const updated = RackSchema.parse({ ...existing, ...partial, id: existing.id });
    this.userRacks.write(updated);
    return updated;
  }

  deleteRack(id: string): void {
    if (this.isBundledRack(id)) {
      throw new Error(`Cannot delete bundled rack "${id}".`);
    }
    if (!this.userRacks.delete(id)) {
      throw new Error(`Rack not found: ${id}.`);
    }
  }

  // ── Memory Configs ───────────────────────────────────────────────

  listMemoryConfigs(filters: MemoryConfigFilters = {}): MemoryConfigSummary[] {
    return this.memories.loadAll()
      .filter(saved => {
        if (filters.slotNumber !== undefined && saved.config.slotNumber !== filters.slotNumber) return false;
        if (filters.genre && !saved.genres?.some(g => g.toLowerCase() === filters.genre!.toLowerCase())) return false;
        return true;
      })
      .map(saved => ({
        id: saved.id,
        name: saved.config.name,
        slotNumber: saved.config.slotNumber,
        sourceRackId: saved.sourceRackId ?? saved.config.sourceRackId,
        genres: saved.genres,
      }));
  }

  getMemoryConfig(id: string): SavedMemoryConfig | null {
    return this.memories.getById(id) ?? null;
  }

  saveMemoryConfig(
    config: MemoryConfig,
    meta?: { id?: string; genres?: string[] },
  ): SavedMemoryConfig {
    return this.memories.save(config, meta);
  }

  deleteMemoryConfig(id: string): void {
    if (!this.memories.delete(id)) {
      throw new Error(`Memory config not found: ${id}.`);
    }
  }
}
