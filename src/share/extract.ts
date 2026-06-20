/**
 * Extract rack or FX module scopes from a MemoryConfig.
 */

import type { MemoryConfig, MemoryFxSlot, MemoryFxSection } from '../schemas/memory-config.js';
import type { Rack, FxSlotData } from '../schemas/rack.js';
import type { FxModule } from '../schemas/fx-module.js';
import type { FxSlotId } from '../schemas/fx-param.js';
import { slugifyId } from '../stores/paths.js';

export type FxSectionName = 'inputFx' | 'trackFx';

function memorySlotToFxSlotData(slot: MemoryFxSlot, bank: FxSlotId): FxSlotData {
  return {
    slot: slot.slot,
    bank,
    label: slot.label,
    effect: slot.effect,
    fxModuleId: slot.fxModuleId,
    params: slot.params,
    overrides: slot.overrides,
    sequencer: slot.sequencer,
  };
}

function getSection(config: MemoryConfig, section: FxSectionName): MemoryFxSection {
  return section === 'inputFx' ? config.inputFx : config.trackFx;
}

function findBank(section: MemoryFxSection, bank: FxSlotId) {
  return section.banks.find(b => b.bank === bank);
}

export function extractRackFromMemory(
  config: MemoryConfig,
  section: FxSectionName,
  bank: FxSlotId,
): Rack {
  const bankData = findBank(getSection(config, section), bank);
  if (!bankData || bankData.slots.length === 0) {
    throw new Error(`No FX in ${section} bank ${bank} for memory "${config.name}".`);
  }

  const inputFx =
    section === 'inputFx'
      ? bankData.slots.map(s => memorySlotToFxSlotData(s, bank))
      : [];
  const trackFx =
    section === 'trackFx'
      ? bankData.slots.map(s => memorySlotToFxSlotData(s, bank))
      : [];

  const title = `${config.name} ${section} ${bank}`.slice(0, 12).trim() || config.name;

  return {
    id: slugifyId(`${config.name}-${section}-${bank}`),
    section: section === 'inputFx' ? 'input' : 'track',
    title,
    icon: '',
    genres: config.genres ?? [],
    inputType: section === 'inputFx' ? 'input' : 'track',
    description: `Extracted from memory slot ${config.slotNumber} (${section} bank ${bank}).`,
    inputFx,
    trackFx,
    tips: [],
    settings: {
      master: config.master,
      tracks: config.tracks,
      rec: config.rec,
      play: config.play,
      rhythm: config.rhythm,
    },
  };
}

export function extractFxModuleFromMemory(
  config: MemoryConfig,
  section: FxSectionName,
  bank: FxSlotId,
  slotId: FxSlotId,
): FxModule {
  const bankData = findBank(getSection(config, section), bank);
  const slot = bankData?.slots.find(s => s.slot === slotId);
  if (!slot) {
    throw new Error(`No FX in ${section} bank ${bank} slot ${slotId} for memory "${config.name}".`);
  }

  const effectSlug = slot.effect.toLowerCase().replace(/_/g, '-');
  const id = slugifyId(`${config.name}-${section}-${bank}-${slotId}-${effectSlug}`);

  return {
    id,
    effect: slot.effect,
    title: slot.label || `${slot.effect} (${bank}${slotId})`,
    category: effectSlug,
    context: [section === 'inputFx' ? 'ifx' : 'tfx'],
    usage: 'both',
    description: `Extracted from memory slot ${config.slotNumber}, ${section} bank ${bank} slot ${slotId}.`,
    params: slot.params,
    sequencer: slot.sequencer,
    tags: config.genres,
  };
}
