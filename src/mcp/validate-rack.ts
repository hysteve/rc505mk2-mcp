/**
 * Hardware placement rules for rack presets — Input FX vs Track FX, special TFX Slot A.
 */

import { SPECIAL_TRACK_FX } from '../fx/fx-names.js';
import { EFFECT_NAME_MAP } from '../params/effect-map.js';
import type { FxSlotData } from '../schemas/rack.js';

const SPECIAL_TFX_LIST = [...SPECIAL_TRACK_FX].join(', ');

function resolveEffectName(effect: string): string {
  const key = effect.toUpperCase();
  return EFFECT_NAME_MAP[key] ?? key.replace(/[\s-]+/g, '_');
}

function isSpecialTrackFx(effect: string): boolean {
  return SPECIAL_TRACK_FX.has(resolveEffectName(effect));
}

function formatSlotRef(slot: FxSlotData, context: 'ifx' | 'tfx'): string {
  if (context === 'tfx' && slot.bank) {
    return `Track FX bank ${slot.bank} slot ${slot.slot}`;
  }
  return context === 'ifx' ? `Input FX slot ${slot.slot}` : `Track FX slot ${slot.slot}`;
}

const VALID_TFX_BANKS = new Set(['A', 'B']);

/**
 * Validate slot/bank field usage. Returns an error message or null if valid.
 */
export function validateRackSlotStructure(rack: {
  inputFx: FxSlotData[];
  trackFx: FxSlotData[];
}): string | null {
  for (const slot of rack.inputFx) {
    if (slot.bank != null && slot.bank !== '') {
      return (
        `Input FX slot ${slot.slot}: do not set bank on inputFx — IFX has one chain (slots A-D only). ` +
        `Use { slot: "A"|"B"|"C"|"D", fxModuleId?, effect?, params: [] }.`
      );
    }
  }

  for (const slot of rack.trackFx) {
    const bank = String(slot.bank ?? 'A').toUpperCase();
    const slotId = String(slot.slot).toUpperCase();

    if (!VALID_TFX_BANKS.has(bank)) {
      return (
        `Track FX: bank must be "A" or "B" (got "${slot.bank}"). ` +
        `The RC-505 has two Track FX banks, each with slots A-D. ` +
        `Use slot for position within the bank — e.g. three modules in bank A: ` +
        `{ slot: "A", bank: "A" }, { slot: "B", bank: "A" }, { slot: "C", bank: "A" }. ` +
        `Do not use bank C/D or put the bank letter in the slot field.`
      );
    }

    if (!['A', 'B', 'C', 'D'].includes(slotId)) {
      return `Track FX bank ${bank}: slot must be "A", "B", "C", or "D" (got "${slot.slot}").`;
    }
  }

  return null;
}

/**
 * Validate IFX/TFX placement for a rack. Returns an error message or null if valid.
 */
export function validateRackFxPlacement(rack: {
  inputFx: FxSlotData[];
  trackFx: FxSlotData[];
}): string | null {
  const structureError = validateRackSlotStructure(rack);
  if (structureError) return structureError;

  for (const slot of rack.inputFx) {
    if (isSpecialTrackFx(slot.effect)) {
      return (
        `${formatSlotRef(slot, 'ifx')}: ${resolveEffectName(slot.effect)} is Track FX only ` +
        `(${SPECIAL_TFX_LIST}) and cannot be used in Input FX.`
      );
    }
  }

  const specialByBank = new Map<string, FxSlotData>();

  for (const slot of rack.trackFx) {
    if (!isSpecialTrackFx(slot.effect)) continue;

    const effect = resolveEffectName(slot.effect);
    const bank = (slot.bank ?? 'A').toUpperCase();
    const slotId = slot.slot.toUpperCase();

    if (slotId !== 'A') {
      return (
        `${formatSlotRef({ ...slot, bank: bank as FxSlotData['bank'] }, 'tfx')}: ${effect} ` +
        `must be in Slot A (only Slot A supports ${SPECIAL_TFX_LIST}).`
      );
    }

    const existing = specialByBank.get(bank);
    if (existing) {
      return (
        `Track FX bank ${bank}: only one special Track FX allowed per bank ` +
        `(${SPECIAL_TFX_LIST}). Found ${resolveEffectName(existing.effect)} and ${effect}.`
      );
    }
    specialByBank.set(bank, slot);
  }

  return null;
}
