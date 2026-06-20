/**
 * MCP preset tool handlers — browse, CRUD, build, and generate.
 * File-backed via PresetStore; no auth required.
 */

import { memoryConfigToRc0Pair, rackToMemoryConfig } from '../generator/rc0-generator.js';
import { getDefaultTemplate } from '../template/template-loader.js';
import { resolveMemoryConfig, resolveRackPreset } from '../config/resolve.js';
import { EFFECT_NAME_MAP } from '../params/effect-map.js';
import type { MemoryConfig, MemoryBank, MemoryFxSlot } from '../schemas/memory-config.js';
import type { FxSlotId } from '../schemas/fx-param.js';
import { PresetStore } from '../stores/preset-store.js';
import {
  resolveFxModuleFilePath,
  resolveMemoryFilePath,
  resolveRackFilePath,
} from '../stores/paths.js';
import type { Rack } from '../schemas/rack.js';
import {
  validateInput,
  CreateFxModuleInputSchema,
  UpdateFxModuleInputSchema,
  DeleteFxModuleInputSchema,
  GetFxModuleInputSchema,
  ListFxModulesInputSchema,
  CreateRackPresetInputSchema,
  UpdateRackPresetInputSchema,
  DeleteRackPresetInputSchema,
  GetRackPresetInputSchema,
  ListRackPresetsInputSchema,
  SaveMemoryConfigInputSchema,
  ListMemoryConfigsInputSchema,
  GenerateMemoryInputSchema,
  BuildRackConfigInputSchema,
  ResolveRackInputSchema,
  GetMemoryConfigInputSchema,
} from './input-schemas.js';
import { validateRackFxPlacement } from './validate-rack.js';
import { normalizeRackPresetArgs } from './normalize-rack-input.js';

// Shared store instance — tests can inject via setPresetStore()
let store = new PresetStore();

export function setPresetStore(presetStore: PresetStore): void {
  store = presetStore;
}

export function getPresetStore(): PresetStore {
  return store;
}

// ── Helpers ──────────────────────────────────────────────────────

const VALID_SLOT_IDS = new Set<string>(['A', 'B', 'C', 'D']);

function toSlotId(value: string): FxSlotId {
  const upper = value.toUpperCase();
  return VALID_SLOT_IDS.has(upper) ? (upper as FxSlotId) : 'A';
}

function buildMemoryBanks(
  fxList?: Array<{
    slot: string;
    bank?: string;
    effect: string;
    fxModuleId?: string;
    params?: Array<{ name: string; value: string | number }>;
    overrides?: Array<{ name: string; value: string | number }>;
    sequencer?: Array<{ name: string; value: string | number }>;
  }>,
): MemoryBank[] {
  if (!fxList?.length) return [];
  const bankMap = new Map<string, MemoryFxSlot[]>();

  for (const fx of fxList) {
    const bank = toSlotId(fx.bank ?? 'A');
    const resolved =
      EFFECT_NAME_MAP[fx.effect.toUpperCase()] || fx.effect.toUpperCase();

    if (!bankMap.has(bank)) bankMap.set(bank, []);
    const slot: MemoryFxSlot = {
      slot: toSlotId(fx.slot),
      effect: resolved,
      enabled: true,
      params: (fx.params ?? []).map(p => ({
        name: p.name,
        value: String(p.value),
      })),
    };

    if (fx.fxModuleId) slot.fxModuleId = fx.fxModuleId;
    if (fx.overrides?.length) {
      slot.overrides = fx.overrides.map(p => ({
        name: p.name,
        value: String(p.value),
      }));
    }
    if (fx.sequencer?.length) {
      slot.sequencer = fx.sequencer.map(p => ({
        name: p.name,
        value: String(p.value),
      }));
    }

    bankMap.get(bank)!.push(slot);
  }

  return Array.from(bankMap.entries()).map(([bank, slots]) => ({
    bank: bank as FxSlotId,
    slots,
  }));
}

export function resolveMemoryConfigFromRack(
  rackId: string,
  slotNumber: number,
  name?: string,
): { config: MemoryConfig } | { error: string } {
  const rack = store.getRack(rackId);
  if (!rack) {
    return { error: `Rack preset not found: ${rackId}.` };
  }
  const config = rackToMemoryConfig(rack, slotNumber);
  if (name) config.name = name.slice(0, 12);
  const getModule = (id: string) => store.getModuleById(id);
  return { config: resolveMemoryConfig(config, getModule) };
}

function assertValidRackFxPlacement(rack: Pick<Rack, 'inputFx' | 'trackFx'>): string | null {
  return validateRackFxPlacement(rack);
}

// ── FX Module Handlers ───────────────────────────────────────────

export function handleListFxModules(args: Record<string, unknown>): object {
  const v = validateInput(ListFxModulesInputSchema, args);
  if (!v.success) return { error: v.error };

  const modules = store.listFxModules(v.data);
  return { modules, count: modules.length };
}

export function handleGetFxModule(args: Record<string, unknown>): object {
  const v = validateInput(GetFxModuleInputSchema, args);
  if (!v.success) return { error: v.error };

  const mod = store.getFxModule(v.data.module_id);
  if (!mod) {
    return { error: `FX module not found: ${v.data.module_id}.` };
  }
  return { module: mod };
}

export function handleCreateFxModule(args: Record<string, unknown>): object {
  const v = validateInput(CreateFxModuleInputSchema, args);
  if (!v.success) return { error: v.error };

  try {
    const mod = store.createFxModule(v.data);
    return {
      module: mod,
      file_path: resolveFxModuleFilePath(mod),
      message: `FX module "${mod.title}" saved to user store.`,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export function handleUpdateFxModule(args: Record<string, unknown>): object {
  const v = validateInput(UpdateFxModuleInputSchema, args);
  if (!v.success) return { error: v.error };

  try {
    const mod = store.updateFxModule(v.data.module_id, v.data.data);
    return { module: mod };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export function handleDeleteFxModule(args: Record<string, unknown>): object {
  const v = validateInput(DeleteFxModuleInputSchema, args);
  if (!v.success) return { error: v.error };

  try {
    store.deleteFxModule(v.data.module_id);
    return { deleted: true, id: v.data.module_id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Rack Preset Handlers ─────────────────────────────────────────

export function handleListRackPresets(args: Record<string, unknown>): object {
  const v = validateInput(ListRackPresetsInputSchema, args);
  if (!v.success) return { error: v.error };

  const presets = store.listRacks(v.data);
  return { presets, count: presets.length };
}

export function handleGetRackPreset(args: Record<string, unknown>): object {
  const v = validateInput(GetRackPresetInputSchema, args);
  if (!v.success) return { error: v.error };

  const rack = store.getRack(v.data.rack_id);
  if (!rack) {
    return { error: `Rack preset not found: ${v.data.rack_id}.` };
  }
  return { rack };
}

export function handleCreateRackPreset(args: Record<string, unknown>): object {
  const normalized = normalizeRackPresetArgs(args, store);
  const v = validateInput(CreateRackPresetInputSchema, normalized);
  if (!v.success) return { error: v.error };

  const rackData = {
    ...v.data,
    section: v.data.section ?? 'custom',
    icon: v.data.icon ?? '',
    inputType: v.data.inputType ?? 'mic',
    description: v.data.description ?? '',
    tips: v.data.tips ?? [],
  };
  const placementError = assertValidRackFxPlacement(rackData);
  if (placementError) return { error: placementError };

  try {
    const rack = store.createRack(rackData);
    return {
      rack,
      file_path: resolveRackFilePath(rack.id),
      message: `Rack "${rack.title}" saved to user store.`,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export function handleUpdateRackPreset(args: Record<string, unknown>): object {
  const normalizedArgs =
    args.data && typeof args.data === 'object'
      ? { ...args, data: normalizeRackPresetArgs(args.data as Record<string, unknown>, store) }
      : args;
  const v = validateInput(UpdateRackPresetInputSchema, normalizedArgs);
  if (!v.success) return { error: v.error };

  const existing = store.getRack(v.data.rack_id);
  if (!existing) {
    return { error: `Rack preset not found: ${v.data.rack_id}.` };
  }
  if (existing.source === 'bundled') {
    return { error: `Cannot update bundled rack "${v.data.rack_id}". Create a copy with create_rack_preset instead.` };
  }

  const merged = { ...existing, ...v.data.data, id: existing.id };
  const normalized = normalizeRackPresetArgs(merged as Record<string, unknown>, store);
  const placementError = assertValidRackFxPlacement(normalized as Pick<Rack, 'inputFx' | 'trackFx'>);
  if (placementError) return { error: placementError };

  try {
    const rack = store.updateRack(v.data.rack_id, normalized as Partial<Rack>);
    return { rack };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export function handleDeleteRackPreset(args: Record<string, unknown>): object {
  const v = validateInput(DeleteRackPresetInputSchema, args);
  if (!v.success) return { error: v.error };

  try {
    store.deleteRack(v.data.rack_id);
    return { deleted: true, id: v.data.rack_id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Memory Config Handlers ───────────────────────────────────────

export function handleSaveMemoryConfig(args: Record<string, unknown>): object {
  const v = validateInput(SaveMemoryConfigInputSchema, args);
  if (!v.success) return { error: v.error };

  try {
    const saved = store.saveMemoryConfig(v.data.config, { genres: v.data.genres });
    return {
      id: saved.id,
      config: saved.config,
      file_path: resolveMemoryFilePath(saved.id),
      message: `Memory config "${saved.config.name}" saved.`,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export function handleListMemoryConfigs(args: Record<string, unknown>): object {
  const v = validateInput(ListMemoryConfigsInputSchema, args);
  if (!v.success) return { error: v.error };

  const configs = store.listMemoryConfigs({
    genre: v.data.genre,
    slotNumber: v.data.slot_number,
  });
  return { configs, count: configs.length };
}

export function handleGetMemoryConfig(args: Record<string, unknown>): object {
  const v = validateInput(GetMemoryConfigInputSchema, args);
  if (!v.success) return { error: v.error };

  const saved = store.getMemoryConfig(v.data.memory_id);
  if (!saved) {
    return { error: `Memory config not found: ${v.data.memory_id}.` };
  }
  return {
    id: saved.id,
    config: saved.config,
    genres: saved.genres,
    sourceRackId: saved.sourceRackId,
    savedAt: saved.savedAt,
  };
}

// ── Generation Handlers ──────────────────────────────────────────

export function handleGenerateMemory(args: Record<string, unknown>): object {
  const v = validateInput(GenerateMemoryInputSchema, args);
  if (!v.success) return { error: v.error };

  try {
    const getModule = (id: string) => store.getModuleById(id);
    const resolved = resolveMemoryConfig(v.data.config, getModule);
    const template = getDefaultTemplate();
    const { xmlA, xmlB } = memoryConfigToRc0Pair(template, resolved);

    return {
      config: resolved,
      rc0_a: Buffer.from(xmlA).toString('base64'),
      rc0_b: Buffer.from(xmlB).toString('base64'),
      message: 'RC0 data generated. Use upload_memory to write to the device.',
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export function handleBuildRackConfig(args: Record<string, unknown>): object {
  const v = validateInput(BuildRackConfigInputSchema, args);
  if (!v.success) return { error: v.error };

  if (v.data.rack_id) {
    const rack = store.getRack(v.data.rack_id);
    if (!rack) {
      return { error: `Rack preset not found: ${v.data.rack_id}.` };
    }
    const config = rackToMemoryConfig(rack, v.data.slot_number);
    if (v.data.name) config.name = v.data.name.slice(0, 12);
    const getModule = (id: string) => store.getModuleById(id);
    return { config: resolveMemoryConfig(config, getModule) };
  }

  const config: MemoryConfig = {
    version: 1,
    slotNumber: v.data.slot_number,
    name: (v.data.name ?? 'PRESET').slice(0, 12),
    inputFx: {
      banks: buildMemoryBanks(v.data.input_fx),
    },
    trackFx: {
      banks: buildMemoryBanks(v.data.track_fx),
    },
    master: v.data.tempo ? { tempo: v.data.tempo } : undefined,
  };

  const getModule = (id: string) => store.getModuleById(id);
  return { config: resolveMemoryConfig(config, getModule) };
}

export function handleResolveRack(args: Record<string, unknown>): object {
  const v = validateInput(ResolveRackInputSchema, args);
  if (!v.success) return { error: v.error };

  const rack = store.getRack(v.data.rack_id);
  if (!rack) {
    return { error: `Rack preset not found: ${v.data.rack_id}.` };
  }

  const getModule = (id: string) => store.getModuleById(id);
  const resolved = resolveRackPreset(rack, getModule);
  return { rack: resolved, resolved: true };
}
