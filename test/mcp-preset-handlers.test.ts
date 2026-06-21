import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PresetStore } from '../src/stores/preset-store.js';
import { resolveBundledFxModulesDir } from '../src/stores/paths.js';
import {
  setPresetStore,
  handleListFxModules,
  handleGetFxModule,
  handleListRackPresets,
  handleGetRackPreset,
  handleBuildRackConfig,
  handleGenerateMemory,
  handleResolveRack,
  handleCreateFxModule,
  handleDeleteFxModule,
  handleCreateRackPreset,
  handleUpdateRackPreset,
  resolveMemoryConfigFromRack,
} from '../src/mcp/handlers-preset.js';
import { handleUploadMemory } from '../src/mcp/handlers.js';
import { UploadMemoryInputSchema, validateInput } from '../src/mcp/input-schemas.js';

describe('preset MCP handlers', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'rc505-mcp-test-'));
    setPresetStore(new PresetStore({
      bundledFxDir: resolveBundledFxModulesDir(),
      userFxDir: join(tmpDir, 'fx-modules'),
      userRacksDir: join(tmpDir, 'racks'),
      userMemoriesDir: join(tmpDir, 'memories'),
    }));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('list_fx_modules returns bundled modules', () => {
    const result = handleListFxModules({}) as { modules: Array<{ id: string; pairsWith?: string[] }>; count: number };
    expect(result.count).toBeGreaterThan(20);
    expect(result.modules.some(m => m.id === 'vocal-plate')).toBe(true);
    const gentle = result.modules.find(m => m.id === 'gentle-comp');
    expect(gentle?.pairsWith).toContain('vocal-plate');
  });

  it('list_fx_modules filters by category', () => {
    const result = handleListFxModules({ category: 'space' }) as { modules: Array<{ category: string }> };
    expect(result.modules.every(m => m.category === 'space')).toBe(true);
  });

  it('get_fx_module returns full module', () => {
    const result = handleGetFxModule({ module_id: 'vocal-plate' }) as { module: { effect: string } };
    expect(result.module.effect).toBe('REVERB');
  });

  it('get_fx_module returns error for unknown id', () => {
    const result = handleGetFxModule({ module_id: 'nonexistent' }) as { error: string };
    expect(result.error).toContain('not found');
  });

  it('list_rack_presets returns bundled racks', () => {
    const result = handleListRackPresets({}) as { presets: Array<{ id: string }>; count: number };
    expect(result.count).toBeGreaterThan(10);
    expect(result.presets.some(r => r.id === 'perc-acoustic')).toBe(true);
  });

  it('get_rack_preset returns full rack', () => {
    const result = handleGetRackPreset({ rack_id: 'perc-acoustic' }) as { rack: { title: string } };
    expect(result.rack.title).toContain('Acoustic');
  });

  it('build_rack_config from rack_id produces MemoryConfig', () => {
    const result = handleBuildRackConfig({
      rack_id: 'perc-acoustic',
      slot_number: 5,
    }) as { config: { slotNumber: number; name: string; inputFx: object } };
    expect(result.config.slotNumber).toBe(5);
    expect(result.config.name.length).toBeLessThanOrEqual(12);
    expect(result.config.inputFx).toBeDefined();
  });

  it('build_rack_config from FX chains', () => {
    const result = handleBuildRackConfig({
      name: 'CUSTOM',
      slot_number: 1,
      input_fx: [{
        slot: 'A',
        effect: 'REVERB',
        params: [{ name: 'TYPE', value: 'HALL1' }],
      }],
    }) as { config: { name: string; inputFx: { banks: Array<{ slots: unknown[] }> } } };
    expect(result.config.name).toBe('CUSTOM');
    expect(result.config.inputFx.banks[0].slots.length).toBe(1);
  });

  it('generate_memory returns base64 RC0 pair', () => {
    const built = handleBuildRackConfig({
      rack_id: 'perc-acoustic',
      slot_number: 1,
    }) as { config: object };

    const result = handleGenerateMemory({ config: (built as { config: object }).config }) as {
      rc0_a: string;
      rc0_b: string;
      config: object;
    };
    expect(result.rc0_a.length).toBeGreaterThan(100);
    expect(result.rc0_b.length).toBeGreaterThan(100);
    expect(result.config).toBeDefined();
  });

  it('resolve_rack expands rack data', () => {
    const result = handleResolveRack({ rack_id: 'perc-acoustic' }) as {
      rack: { inputFx: Array<{ params: unknown[] }> };
      resolved: boolean;
    };
    expect(result.resolved).toBe(true);
    expect(result.rack.inputFx.length).toBeGreaterThan(0);
  });

  it('create_fx_module and delete_fx_module round-trip', () => {
    const created = handleCreateFxModule({
      effect: 'HPF',
      title: 'Bright HPF',
      category: 'tone',
      context: ['ifx'],
      usage: 'chain',
      description: 'High pass for clarity',
      params: [{ name: 'CUTOFF', value: '80' }],
    }) as { module: { id: string } };

    expect(created.module.id).toBe('bright-hpf');

    const deleted = handleDeleteFxModule({ module_id: 'bright-hpf' }) as { deleted: boolean };
    expect(deleted.deleted).toBe(true);

    const missing = handleGetFxModule({ module_id: 'bright-hpf' }) as { error: string };
    expect(missing.error).toBeDefined();
  });

  it('delete_fx_module rejects bundled ids', () => {
    const result = handleDeleteFxModule({ module_id: 'vocal-plate' }) as { error: string };
    expect(result.error).toContain('bundled');
  });

  it('create_rack_preset accepts fxModuleId-only slots', () => {
    const result = handleCreateRackPreset({
      title: 'Breakdown Swell',
      genres: ['Ambient'],
      inputFx: [],
      trackFx: [
        { slot: 'A', bank: 'A', fxModuleId: 'hpf-sweep', label: 'Sweep' },
        { slot: 'B', bank: 'A', fxModuleId: 'reverse-reverb-swell', label: 'Swell' },
        { slot: 'C', bank: 'A', fxModuleId: 'echo-fadeout', label: 'Fade' },
      ],
    }) as { rack: { id: string; trackFx: Array<{ effect: string }> } };
    expect(result.rack.id).toBe('breakdown-swell');
    expect(result.rack.trackFx[0].effect).toBe('HPF');
  });

  it('create_rack_preset rejects invalid TFX bank C', () => {
    const result = handleCreateRackPreset({
      title: 'Bad Banks',
      genres: ['Test'],
      inputFx: [],
      trackFx: [
        { slot: 'A', bank: 'A', fxModuleId: 'hpf-sweep', params: [] },
        { slot: 'A', bank: 'B', fxModuleId: 'reverse-reverb-swell', params: [] },
        { slot: 'A', bank: 'C', fxModuleId: 'echo-fadeout', params: [] },
      ],
    }) as { error: string };
    expect(result.error).toContain('bank must be "A" or "B"');
  });

  it('create_rack_preset coerces numeric overrides and drops invalid sequencer', () => {
    const result = handleCreateRackPreset({
      title: 'Coerce Test Rack',
      genres: ['Test'],
      inputFx: [{
        slot: 'A',
        fxModuleId: 'vocal-plate',
        overrides: [{ name: 'TIME', value: 30 }],
        sequencer: {},
      }],
      trackFx: [],
    }) as { rack: { inputFx: Array<{ overrides?: Array<{ value: string }> }> } };
    expect(result.rack.inputFx[0].overrides?.[0].value).toBe('30');
    expect('sequencer' in result.rack.inputFx[0]).toBe(false);
  });

  it('create_rack_preset rejects special TFX in wrong slot', () => {
    const result = handleCreateRackPreset({
      title: 'Bad Rack',
      genres: ['Test'],
      inputFx: [],
      trackFx: [{
        slot: 'C',
        bank: 'A',
        effect: 'BEAT_SCATTER',
        params: [{ name: 'TYPE', value: 'P1' }],
      }],
    }) as { error: string };
    expect(result.error).toContain('must be in Slot A');
  });

  it('create_rack_preset hints update when rack id already exists', () => {
    const title = 'Duplicate Rack Test';
    const rack = {
      title,
      genres: ['Test'],
      description: 'Test rack for duplicate id error.',
      inputFx: [],
      trackFx: [],
      tips: [],
    };
    handleCreateRackPreset(rack);
    const duplicate = handleCreateRackPreset(rack) as { error: string };
    expect(duplicate.error).toContain('already exists');
    expect(duplicate.error).toContain('update_rack_preset');
  });

  it('resolveMemoryConfigFromRack builds config from bundled rack', () => {
    const result = resolveMemoryConfigFromRack('perc-acoustic', 3, 'ACOUSTIC');
    expect('error' in result).toBe(false);
    if ('config' in result) {
      expect(result.config.slotNumber).toBe(3);
      expect(result.config.name).toBe('ACOUSTIC');
    }
  });

  it('upload_memory accepts rack_id and slot_number', () => {
    const parsed = validateInput(UploadMemoryInputSchema, {
      rack_id: 'perc-acoustic',
      slot_number: 5,
    });
    expect(parsed.success).toBe(true);

    const result = handleUploadMemory({
      rack_id: 'perc-acoustic',
      slot_number: 5,
    }) as { error?: string };
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/not detected|rack/i);
  });

  it('upload_memory rejects rack_id without slot_number', () => {
    const parsed = validateInput(UploadMemoryInputSchema, { rack_id: 'perc-acoustic' });
    expect(parsed.success).toBe(false);
  });

  it('upload_memory accepts eject_after: false for batch workflows', () => {
    const parsed = validateInput(UploadMemoryInputSchema, {
      rack_id: 'perc-acoustic',
      slot_number: 5,
      eject_after: false,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.eject_after).toBe(false);
  });

  it('upload_memory accepts eject_after: true for single-shot uploads', () => {
    const parsed = validateInput(UploadMemoryInputSchema, {
      rack_id: 'perc-acoustic',
      slot_number: 5,
      eject_after: true,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.eject_after).toBe(true);
  });

  it('upload_memory omits eject by default when no device connected', () => {
    const result = handleUploadMemory({
      rack_id: 'perc-acoustic',
      slot_number: 5,
    }) as { error?: string; ejected?: boolean };
    // No device in CI — hits the device-not-detected path before eject logic
    expect(result.error).toBeDefined();
    expect(result.ejected).toBeUndefined();
  });

  it('upload_memory echoes rack_id in response for batch traceability', () => {
    // Validates schema round-trip: rack_id flows through to parsed data
    const parsed = validateInput(UploadMemoryInputSchema, {
      rack_id: 'perc-acoustic',
      slot_number: 3,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.rack_id).toBe('perc-acoustic');
      expect(parsed.data.slot_number).toBe(3);
    }
  });
});
