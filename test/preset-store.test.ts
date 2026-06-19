import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PresetStore } from '../src/stores/preset-store.js';
import { resolveBundledFxModulesDir } from '../src/stores/paths.js';
import type { MemoryConfig } from '../src/schemas/memory-config.js';

describe('PresetStore', () => {
  let tmpDir: string;
  let store: PresetStore;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'rc505-test-'));
    store = new PresetStore({
      bundledFxDir: resolveBundledFxModulesDir(),
      userFxDir: join(tmpDir, 'fx-modules'),
      userRacksDir: join(tmpDir, 'racks'),
      userMemoriesDir: join(tmpDir, 'memories'),
    });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('lists bundled FX modules', () => {
    const modules = store.listFxModules();
    expect(modules.length).toBeGreaterThan(20);
    expect(modules.some(m => m.id === 'vocal-plate')).toBe(true);
    expect(modules.find(m => m.id === 'vocal-plate')?.source).toBe('bundled');
  });

  it('gets a bundled FX module by id', () => {
    const mod = store.getFxModule('vocal-plate');
    expect(mod).toBeDefined();
    expect(mod!.effect).toBe('REVERB');
    expect(mod!.source).toBe('bundled');
  });

  it('creates and retrieves a user FX module', () => {
    const mod = store.createFxModule({
      effect: 'DELAY',
      title: 'Test Delay',
      category: 'time',
      context: ['tfx'],
      usage: 'both',
      description: 'Test module',
      params: [{ name: 'TIME', value: '500' }],
    });
    expect(mod.id).toBe('test-delay');
    expect(store.getFxModule('test-delay')?.source).toBe('user');
  });

  it('rejects creating module with bundled id', () => {
    expect(() =>
      store.createFxModule({
        id: 'vocal-plate',
        effect: 'REVERB',
        title: 'Clone',
        category: 'space',
        context: ['ifx'],
        usage: 'chain',
        description: 'dup',
        params: [],
      }),
    ).toThrow(/bundled ID/);
  });

  it('rejects updating bundled FX module', () => {
    expect(() => store.updateFxModule('vocal-plate', { title: 'Nope' })).toThrow(/bundled/);
  });

  it('lists bundled rack presets', () => {
    const racks = store.listRacks();
    expect(racks.length).toBeGreaterThan(10);
    expect(racks.some(r => r.id === 'perc-acoustic')).toBe(true);
  });

  it('gets a bundled rack by id', () => {
    const rack = store.getRack('perc-acoustic');
    expect(rack).toBeDefined();
    expect(rack!.source).toBe('bundled');
  });

  it('builds memory config from rack via getModuleById', () => {
    const mod = store.getModuleById('vocal-plate');
    expect(mod).toBeDefined();
  });

  it('saves and lists memory configs', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 3,
      name: 'VOCAL TEST',
      inputFx: { banks: [] },
      trackFx: { banks: [] },
    };
    const saved = store.saveMemoryConfig(config, { genres: ['Vocal'] });
    expect(saved.id).toContain('slot-03');
    const listed = store.listMemoryConfigs({ slotNumber: 3 });
    expect(listed.some(c => c.id === saved.id)).toBe(true);
  });

  it('user module shadows bundled id on read', () => {
    store.createFxModule({
      id: 'shadow-test',
      effect: 'REVERB',
      title: 'Shadow',
      category: 'space',
      context: ['ifx'],
      usage: 'chain',
      description: 'user shadow',
      params: [{ name: 'TIME', value: '1.0' }],
    });
    // vocal-plate stays bundled; shadow-test is user-only
    expect(store.getFxModule('shadow-test')?.source).toBe('user');
  });
});
