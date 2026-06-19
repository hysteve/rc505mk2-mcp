/**
 * RC-505mk2 Preset Generator — String-based Core
 *
 * Generates RC0 XML preset files from MemoryConfig or Rack objects
 * by merging settings into the 25,504-line template.
 */

import type { Rack, FxSlotData, PresetSettings, TrackSettings, MasterSettings } from '../types/rack.js';
import type { MemoryConfig, MemoryFxSection, MemoryBank, MemoryFxSlot } from '../types/memory-config.js';
import { EFFECT_NAME_MAP } from '../params/effect-map.js';
import { PARAM_MAP, SEQ_TARGETS } from '../params/param-map.js';
import { num } from '../params/transforms.js';
import { resolveFxIndex, SPECIAL_TRACK_FX, RC0_SEQ_FX_MAP } from '../fx/index.js';
import type { FxContext } from '../fx/index.js';
import { findSection, queueEdit, applyEdits } from './xml-ops.js';
import type { TextEdit } from './xml-ops.js';
import { formatHexCount } from '../parser/hex-count.js';

// ── Preset name encoding (ASCII, 12 chars, right-padded with spaces) ─

export function encodePresetName(name: string): number[] {
  const padded = name.slice(0, 12).padEnd(12, ' ');
  return Array.from(padded).map((ch) => ch.charCodeAt(0));
}

// ── FX edit collection ───────────────────────────────────────────────

function collectFxEdits(
  edits: TextEdit[],
  xml: string,
  sectionRange: [number, number],
  slots: FxSlotData[],
  context: FxContext,
) {
  if (slots.length === 0) return;

  const firstBank = (slots[0]?.bank ?? 'A').toUpperCase();
  const bankIndex = firstBank.charCodeAt(0) - 'A'.charCodeAt(0);
  const setup = findSection(xml, 'SETUP', sectionRange[0], sectionRange[1]);
  if (setup) {
    queueEdit(edits, xml, 'A', bankIndex, setup[0], setup[1]);
  }

  const banksWithSpecialFx = new Set<string>();

  for (const fx of slots) {
    const bank = (fx.bank ?? 'A').toUpperCase();
    const slot = fx.slot.toUpperCase();
    const prefix = bank + slot;

    const rc0FxName = EFFECT_NAME_MAP[fx.effect.toUpperCase()];
    if (!rc0FxName) continue;

    const isSpecial = SPECIAL_TRACK_FX.has(rc0FxName);
    if (isSpecial) {
      if (context === 'ifx') continue;
      if (slot !== 'A') continue;
      if (banksWithSpecialFx.has(bank)) continue;
      banksWithSpecialFx.add(bank);
    }

    const slotConfig = findSection(xml, prefix, sectionRange[0], sectionRange[1]);
    if (!slotConfig) continue;

    queueEdit(edits, xml, 'A', 1, slotConfig[0], slotConfig[1]);

    const fxEnum = resolveFxIndex(rc0FxName, context);
    if (fxEnum === undefined) continue;

    queueEdit(edits, xml, 'C', fxEnum, slotConfig[0], slotConfig[1]);

    const fxBlockName = `${prefix}_${rc0FxName}`;
    const fxBlock = findSection(xml, fxBlockName, sectionRange[0], sectionRange[1]);
    if (!fxBlock) continue;

    const paramDefs = PARAM_MAP[rc0FxName];
    if (!paramDefs) continue;

    for (const param of fx.params) {
      const def = paramDefs[param.name.toUpperCase()];
      if (!def) continue;

      const value = def.transform
        ? def.transform(param.value)
        : num(param.value);

      queueEdit(edits, xml, def.tag, value, fxBlock[0], fxBlock[1]);
    }

    // Write FX sequencer params to the XX_FX_SEQ block.
    const seqParams = 'sequencer' in fx ? (fx as FxSlotData).sequencer : undefined;
    const seqFxName = RC0_SEQ_FX_MAP[rc0FxName];

    if (seqParams?.length && seqFxName) {
      const seqBlockName = `${prefix}_${seqFxName}`;
      const seqBlock = findSection(xml, seqBlockName, sectionRange[0], sectionRange[1]);
      if (seqBlock) {
        const seqDefs = PARAM_MAP[seqFxName];
        if (seqDefs) {
          // Resolve the step transform from the TARGET parameter's parent FX param.
          // TARGET is a 0-based index into SEQ_TARGETS[seqFxName] which names main FX params.
          const targetParam = seqParams.find(p => p.name.toUpperCase() === 'TARGET');
          const targetIndex = targetParam ? parseInt(String(targetParam.value), 10) : 0;
          const targetParamNames = SEQ_TARGETS[seqFxName] ?? [];
          const targetParamName = targetParamNames[targetIndex] ?? targetParamNames[0];
          const parentParams = PARAM_MAP[rc0FxName];
          const stepTransform = targetParamName ? parentParams?.[targetParamName]?.transform : undefined;

          for (const param of seqParams) {
            const paramKey = param.name.toUpperCase();
            const def = seqDefs[paramKey];
            if (!def) continue;

            // STEP params use the target parameter's transform; control params use their own
            const transform = paramKey.startsWith('STEP ')
              ? (stepTransform ?? def.transform)
              : def.transform;
            const value = transform
              ? transform(String(param.value))
              : num(String(param.value));
            queueEdit(edits, xml, def.tag, value, seqBlock[0], seqBlock[1]);
          }
        }
      }
    }
  }
}

// ── Settings edit collection ─────────────────────────────────────────

function collectTrackEdits(edits: TextEdit[], xml: string, memRange: [number, number], tracks: TrackSettings[]) {
  for (const track of tracks) {
    const tagName = `TRACK${track.trackNumber}`;
    const trackSection = findSection(xml, tagName, memRange[0], memRange[1]);
    if (!trackSection) continue;

    if (track.reverse !== undefined) queueEdit(edits, xml, 'A', track.reverse ? 1 : 0, trackSection[0], trackSection[1]);
    if (track.oneShot !== undefined) queueEdit(edits, xml, 'B', track.oneShot ? 1 : 0, trackSection[0], trackSection[1]);
    if (track.pan !== undefined) queueEdit(edits, xml, 'C', track.pan, trackSection[0], trackSection[1]);
    if (track.level !== undefined) queueEdit(edits, xml, 'D', track.level, trackSection[0], trackSection[1]);
    if (track.startMode !== undefined) queueEdit(edits, xml, 'E', track.startMode, trackSection[0], trackSection[1]);
    if (track.stopMode !== undefined) queueEdit(edits, xml, 'F', track.stopMode, trackSection[0], trackSection[1]);
    if (track.fx !== undefined) queueEdit(edits, xml, 'H', track.fx ? 1 : 0, trackSection[0], trackSection[1]);
  }
}

function collectMasterEdits(edits: TextEdit[], xml: string, memRange: [number, number], master: MasterSettings) {
  const masterSection = findSection(xml, 'MASTER', memRange[0], memRange[1]);
  if (!masterSection) return;

  if (master.tempo !== undefined) {
    queueEdit(edits, xml, 'A', Math.round(master.tempo * 10), masterSection[0], masterSection[1]);
  }
}

// ── Core generator ───────────────────────────────────────────────────

export function generatePresetXml(
  templateXml: string,
  rack: Rack,
  countValue: string = '0001',
  settings?: PresetSettings,
): string {
  const edits: TextEdit[] = [];

  const mem = findSection(templateXml, 'mem');
  const ifx = findSection(templateXml, 'ifx');
  const tfx = findSection(templateXml, 'tfx');

  if (mem) {
    const nameSection = findSection(templateXml, 'NAME', mem[0], mem[1]);
    if (nameSection) {
      const ascii = encodePresetName(rack.title);
      const tags = 'ABCDEFGHIJKL'.split('');
      for (let i = 0; i < tags.length; i++) {
        queueEdit(edits, templateXml, tags[i], ascii[i], nameSection[0], nameSection[1]);
      }
    }
  }

  if (ifx && rack.inputFx?.length) {
    collectFxEdits(edits, templateXml, ifx, rack.inputFx, 'ifx');
  }

  if (tfx && rack.trackFx?.length) {
    collectFxEdits(edits, templateXml, tfx, rack.trackFx, 'tfx');
  }

  const s = settings ?? rack.settings;
  if (s && mem) {
    if (s.tracks?.length) collectTrackEdits(edits, templateXml, mem, s.tracks);
    if (s.master) collectMasterEdits(edits, templateXml, mem, s.master);
  }

  let result = applyEdits(templateXml, edits);
  result = result.replace(/<count>[^<]*<\/count>/, `<count>${countValue}</count>`);

  return result;
}

// ── Rack ↔ MemoryConfig Conversion ──────────────────────────────────

function fxSlotsToSection(slots: FxSlotData[]): MemoryFxSection {
  const bankMap = new Map<string, MemoryFxSlot[]>();

  for (const fx of slots) {
    const bank = (fx.bank ?? 'A').toUpperCase();
    const rc0FxName = EFFECT_NAME_MAP[fx.effect.toUpperCase()];
    if (!rc0FxName) continue;

    if (!bankMap.has(bank)) bankMap.set(bank, []);
    const memSlot: MemoryFxSlot = {
      slot: fx.slot,
      effect: rc0FxName,
      label: fx.label,
      enabled: true,
      params: fx.params.map(p => ({ name: p.name, value: p.value })),
    };
    if (fx.sequencer?.length) {
      memSlot.sequencer = fx.sequencer.map(p => ({ name: p.name, value: p.value }));
    }
    bankMap.get(bank)!.push(memSlot);
  }

  const banks: MemoryBank[] = [];
  for (const [bank, bankSlots] of bankMap) {
    banks.push({ bank: bank as MemoryBank['bank'], slots: bankSlots });
  }

  return { banks };
}

export function rackToMemoryConfig(rack: Rack, slotNumber: number = 1): MemoryConfig {
  return {
    version: 1,
    slotNumber,
    name: rack.title.slice(0, 12),
    inputFx: fxSlotsToSection(rack.inputFx ?? []),
    trackFx: fxSlotsToSection(rack.trackFx ?? []),
    tracks: rack.settings?.tracks?.map(t => ({
      trackNumber: t.trackNumber,
      level: t.level,
      pan: t.pan,
      reverse: t.reverse,
      oneShot: t.oneShot,
      fx: t.fx,
      startMode: t.startMode,
      stopMode: t.stopMode,
    })),
    master: rack.settings?.master ? { tempo: rack.settings.master.tempo } : undefined,
    rec: rack.settings?.rec ? { ...rack.settings.rec } : undefined,
    play: rack.settings?.play ? { ...rack.settings.play } : undefined,
    rhythm: rack.settings?.rhythm ? { ...rack.settings.rhythm } : undefined,
    sourceRackId: rack.id,
    genres: rack.genres,
  };
}

function sectionToFxSlots(section: MemoryFxSection): FxSlotData[] {
  const slots: FxSlotData[] = [];
  for (const bank of section.banks) {
    for (const slot of bank.slots) {
      if (slot.enabled === false) continue;
      const fxSlot: FxSlotData = {
        slot: slot.slot,
        bank: bank.bank,
        label: slot.label,
        effect: slot.effect,
        params: slot.params.map(p => ({ name: p.name, value: p.value })),
      };
      if (slot.sequencer?.length) {
        fxSlot.sequencer = slot.sequencer.map(p => ({ name: p.name, value: p.value }));
      }
      slots.push(fxSlot);
    }
  }
  return slots;
}

export function memoryConfigToRc0(
  templateXml: string,
  config: MemoryConfig,
  countValue?: string,
): string {
  const rack: Rack = {
    id: config.sourceRackId ?? `memory-${config.slotNumber}`,
    section: '',
    title: config.name,
    icon: '',
    genres: config.genres ?? [],
    inputType: '',
    description: '',
    inputFx: sectionToFxSlots(config.inputFx),
    trackFx: sectionToFxSlots(config.trackFx),
    tips: [],
    settings: {
      tracks: config.tracks?.map(t => ({
        trackNumber: t.trackNumber,
        level: t.level,
        pan: t.pan,
        reverse: t.reverse,
        oneShot: t.oneShot,
        fx: t.fx,
        startMode: t.startMode,
        stopMode: t.stopMode,
      })),
      master: config.master,
      rec: config.rec ? {
        recAction: config.rec.recAction,
        quantize: config.rec.quantize,
        autoRec: config.rec.autoRec,
        autoRecSens: config.rec.autoRecSens,
      } : undefined,
      play: config.play ? {
        currentTrack: config.play.currentTrack,
        fadeTimeIn: config.play.fadeTimeIn,
        fadeTimeOut: config.play.fadeTimeOut,
      } : undefined,
      rhythm: config.rhythm ? {
        genre: config.rhythm.genre,
        pattern: config.rhythm.pattern,
        variation: config.rhythm.variation,
        kit: config.rhythm.kit,
      } : undefined,
    },
  };

  return generatePresetXml(templateXml, rack, countValue ?? config.count ?? '0001');
}

export function memoryConfigToRc0Pair(
  templateXml: string,
  config: MemoryConfig,
  baseCount: number = 1,
): { xmlA: string; xmlB: string } {
  const xmlA = memoryConfigToRc0(templateXml, config, formatHexCount(baseCount));
  const xmlB = memoryConfigToRc0(templateXml, config, formatHexCount(baseCount + 1));
  return { xmlA, xmlB };
}
