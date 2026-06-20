/**
 * File-based store for saved MemoryConfig snapshots.
 */

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
} from 'node:fs';
import { join } from 'node:path';
import { MemoryConfigSchema, type MemoryConfig } from '../schemas/memory-config.js';
import {
  SavedMemoryConfigSchema,
  type SavedMemoryConfig,
} from '../schemas/saved-memory.js';
import {
  parseSavedMemoryDocument,
  stampDocument,
} from '../schemas/document-version.js';
import { resolveUserMemoriesDir } from './paths.js';
import { touchUserStoreMeta } from './user-meta.js';

export type { SavedMemoryConfig };

export interface MemoryConfigSummary {
  id: string;
  name: string;
  slotNumber: number;
  sourceRackId?: string;
  genres?: string[];
}

export class MemoryStore {
  private dataDir: string;
  private cache: SavedMemoryConfig[] | null = null;

  constructor(dataDir?: string) {
    this.dataDir = dataDir ?? resolveUserMemoriesDir();
  }

  private ensureDir(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  invalidate(): void {
    this.cache = null;
  }

  loadAll(): SavedMemoryConfig[] {
    if (this.cache) return this.cache;

    this.ensureDir();
    const files = readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
    this.cache = files.map(f => {
      const content = readFileSync(join(this.dataDir, f), 'utf-8');
      return parseSavedMemoryDocument(JSON.parse(content));
    });

    return this.cache;
  }

  getById(id: string): SavedMemoryConfig | undefined {
    return this.loadAll().find(c => c.id === id);
  }

  exists(id: string): boolean {
    return this.loadAll().some(c => c.id === id);
  }

  save(
    config: MemoryConfig,
    meta?: { id?: string; genres?: string[] },
  ): SavedMemoryConfig {
    const parsed = MemoryConfigSchema.parse(config);
    const id = meta?.id ?? `slot-${String(parsed.slotNumber).padStart(2, '0')}-${slugifyName(parsed.name)}`;

    const saved = SavedMemoryConfigSchema.parse({
      id,
      config: parsed,
      genres: meta?.genres ?? parsed.genres,
      sourceRackId: parsed.sourceRackId,
      savedAt: new Date().toISOString(),
    });

    this.ensureDir();
    const filePath = join(this.dataDir, `${id}.json`);
    writeFileSync(
      filePath,
      JSON.stringify(stampDocument('savedMemory', saved as unknown as Record<string, unknown>), null, 2) + '\n',
      'utf-8',
    );
    touchUserStoreMeta();
    this.invalidate();
    return saved;
  }

  delete(id: string): boolean {
    const filePath = join(this.dataDir, `${id}.json`);
    if (!existsSync(filePath)) return false;
    unlinkSync(filePath);
    this.invalidate();
    return true;
  }

  getDataDir(): string {
    return this.dataDir;
  }
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 32) || 'preset';
}
