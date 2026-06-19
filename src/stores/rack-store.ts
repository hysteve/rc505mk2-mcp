/**
 * File-based store for user-created rack presets.
 * Bundled racks are loaded separately via loadBundledRacks().
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
import { RackSchema, type Rack } from '../schemas/rack.js';
import { resolveUserRacksDir } from './paths.js';

export class RackStore {
  private dataDir: string;
  private cache: Rack[] | null = null;

  constructor(dataDir?: string) {
    this.dataDir = dataDir ?? resolveUserRacksDir();
  }

  private ensureDir(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  invalidate(): void {
    this.cache = null;
  }

  loadAll(): Rack[] {
    if (this.cache) return this.cache;

    this.ensureDir();
    const files = readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
    this.cache = files.map(f => {
      const content = readFileSync(join(this.dataDir, f), 'utf-8');
      return JSON.parse(content) as Rack;
    });

    return this.cache;
  }

  getById(id: string): Rack | undefined {
    return this.loadAll().find(r => r.id === id);
  }

  exists(id: string): boolean {
    return this.loadAll().some(r => r.id === id);
  }

  write(rack: Rack): string {
    const parsed = RackSchema.parse(rack);
    this.ensureDir();
    const filePath = join(this.dataDir, `${parsed.id}.json`);
    writeFileSync(filePath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8');
    this.invalidate();
    return filePath;
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
