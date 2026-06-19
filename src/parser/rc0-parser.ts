/**
 * RC0 Parser — Reverse generation from MEMORY files to MemoryConfig JSON.
 *
 * Return conventions:
 * - Section lookups (`findSection`, `getTagContent`): `null` when not found.
 * - Parsing functions: `undefined` for absent/empty data, populated object when present.
 *   FX sections always return `{ banks: [] }` (never undefined) since the
 *   MemoryConfig schema requires inputFx/trackFx to be present.
 */

import { findSection, getTagContent } from '../generator/xml-ops.js';
import { fxNameFromIndex } from '../fx/fx-indexes.js';
import type { FxContext } from '../fx/fx-names.js';
import { RC0_SEQ_FX_MAP } from '../fx/fx-names.js';
import { PARAM_MAP, SEQ_TARGETS } from '../params/param-map.js';
import type {
  MemoryConfig,
  MemoryFxSection,
  MemoryBank,
  MemoryFxSlot,
  FxParam,
  MemoryTrackSettings,
  MemoryMasterSettings,
  MemoryFilePair,
} from '../types/memory-config.js';
import { parseHexCount, extractCount } from './hex-count.js';

// ── Preset Name Decoding ────────────────────────────────────────────

function decodePresetName(xml: string, memRange: [number, number]): string {
  const nameSection = findSection(xml, 'NAME', memRange[0], memRange[1]);
  if (!nameSection) return '';

  const tags = 'ABCDEFGHIJKL'.split('');
  const chars: string[] = [];
  for (const tag of tags) {
    const val = getTagContent(xml, tag, nameSection[0], nameSection[1]);
    if (val !== null) {
      const code = parseInt(val, 10);
      if (code >= 32 && code <= 126) {
        chars.push(String.fromCharCode(code));
      }
    }
  }
  return chars.join('').trimEnd();
}

// ── FX Section Parsing ──────────────────────────────────────────────

const BANKS = ['A', 'B', 'C', 'D'] as const;
const SLOTS = ['A', 'B', 'C', 'D'] as const;

function buildReverseParamMap(): Record<string, Record<string, string>> {
  const reverse: Record<string, Record<string, string>> = {};
  for (const [fxName, params] of Object.entries(PARAM_MAP)) {
    reverse[fxName] = {};
    for (const [paramName, def] of Object.entries(params)) {
      reverse[fxName][def.tag] = paramName;
    }
  }
  return reverse;
}

const REVERSE_PARAM_MAP = buildReverseParamMap();

function extractAllTagValues(xml: string, from: number, to: number): Record<string, string> {
  const values: Record<string, string> = {};
  for (let code = 65; code <= 90; code++) {
    const tag = String.fromCharCode(code);
    const val = getTagContent(xml, tag, from, to);
    if (val !== null) {
      values[tag] = val;
    }
  }
  return values;
}

function parseBankSlots(
  xml: string,
  sectionRange: [number, number],
  bank: string,
  context: FxContext,
): MemoryFxSlot[] {
  const slots: MemoryFxSlot[] = [];

  for (const slot of SLOTS) {
    const prefix = bank + slot;

    const slotConfig = findSection(xml, prefix, sectionRange[0], sectionRange[1]);
    if (!slotConfig) continue;

    const sw = getTagContent(xml, 'A', slotConfig[0], slotConfig[1]);
    if (sw !== '1') continue;

    const fxTypeStr = getTagContent(xml, 'C', slotConfig[0], slotConfig[1]);
    if (fxTypeStr === null) continue;
    const fxTypeIndex = parseInt(fxTypeStr, 10);

    const fxName = fxNameFromIndex(fxTypeIndex, context);
    if (!fxName) continue;

    const fxBlockName = `${prefix}_${fxName}`;
    const fxBlock = findSection(xml, fxBlockName, sectionRange[0], sectionRange[1]);

    const params: FxParam[] = [];
    if (fxBlock) {
      const tagValues = extractAllTagValues(xml, fxBlock[0], fxBlock[1]);
      const reverseMap = REVERSE_PARAM_MAP[fxName];

      if (reverseMap) {
        const paramDefs = PARAM_MAP[fxName];
        for (const [tag, value] of Object.entries(tagValues)) {
          const paramName = reverseMap[tag];
          if (paramName) {
            const def = paramDefs?.[paramName];
            const rc0Num = parseInt(value, 10);
            const displayValue = def?.reverse && !isNaN(rc0Num)
              ? def.reverse(rc0Num)
              : value;
            params.push({ name: paramName, value: displayValue });
          }
        }
      }
    }

    // Parse FX sequencer block (e.g., AA_TRANSPOSE_SEQ)
    const seqFxName = RC0_SEQ_FX_MAP[fxName];
    let sequencer: FxParam[] | undefined;
    if (seqFxName) {
      const seqBlockName = `${prefix}_${seqFxName}`;
      const seqBlock = findSection(xml, seqBlockName, sectionRange[0], sectionRange[1]);
      if (seqBlock) {
        const seqTagValues = extractAllTagValues(xml, seqBlock[0], seqBlock[1]);
        const seqReverseMap = REVERSE_PARAM_MAP[seqFxName];
        if (seqReverseMap) {
          // Check if SW (tag A) is ON (value 1)
          const swValue = seqTagValues['A'];
          if (swValue === '1') {
            sequencer = [];
            const seqParamDefs = PARAM_MAP[seqFxName];

            // Resolve TARGET-specific reverse transform for STEP params.
            // TARGET is a 0-based index into SEQ_TARGETS, pointing at a parent FX param
            // whose transform/reverse is used for STEP values.
            const targetRaw = seqTagValues['D'];
            const targetIndex = targetRaw !== undefined ? parseInt(targetRaw, 10) : 0;
            const targetParamNames = SEQ_TARGETS[seqFxName] ?? [];
            const targetParamName = targetParamNames[targetIndex] ?? targetParamNames[0];
            const parentParams = PARAM_MAP[fxName];
            const stepReverse = targetParamName ? parentParams?.[targetParamName]?.reverse : undefined;

            for (const [tag, value] of Object.entries(seqTagValues)) {
              const paramName = seqReverseMap[tag];
              if (paramName) {
                const rc0Num = parseInt(value, 10);
                // STEP params use the target parameter's reverse; control params use their own
                const isStep = paramName.startsWith('STEP ');
                const reverse = isStep
                  ? stepReverse
                  : seqParamDefs?.[paramName]?.reverse;
                const displayValue = reverse && !isNaN(rc0Num)
                  ? reverse(rc0Num)
                  : value;
                sequencer.push({ name: paramName, value: displayValue });
              }
            }
          }
        }
      }
    }

    const memSlot: MemoryFxSlot = {
      slot,
      effect: fxName,
      enabled: true,
      params,
    };
    if (sequencer?.length) {
      memSlot.sequencer = sequencer;
    }
    slots.push(memSlot);
  }

  return slots;
}

function parseFxSection(
  xml: string,
  sectionTag: string,
  context: FxContext,
): MemoryFxSection {
  const sectionRange = findSection(xml, sectionTag);
  if (!sectionRange) return { banks: [] };

  const setup = findSection(xml, 'SETUP', sectionRange[0], sectionRange[1]);
  const activeBankStr = setup ? getTagContent(xml, 'A', setup[0], setup[1]) : null;
  const activeBank = activeBankStr !== null ? parseInt(activeBankStr, 10) : undefined;

  const banks: MemoryBank[] = [];
  for (const bank of BANKS) {
    const slots = parseBankSlots(xml, sectionRange, bank, context);
    if (slots.length > 0) {
      banks.push({ bank, slots });
    }
  }

  return { activeBank, banks };
}

// ── Track & Master Parsing ──────────────────────────────────────────

function parseTrackSettings(xml: string, memRange: [number, number]): MemoryTrackSettings[] {
  const tracks: MemoryTrackSettings[] = [];

  for (let i = 1; i <= 5; i++) {
    const trackSection = findSection(xml, `TRACK${i}`, memRange[0], memRange[1]);
    if (!trackSection) continue;

    const a = getTagContent(xml, 'A', trackSection[0], trackSection[1]);
    const b = getTagContent(xml, 'B', trackSection[0], trackSection[1]);
    const c = getTagContent(xml, 'C', trackSection[0], trackSection[1]);
    const d = getTagContent(xml, 'D', trackSection[0], trackSection[1]);
    const e = getTagContent(xml, 'E', trackSection[0], trackSection[1]);
    const f = getTagContent(xml, 'F', trackSection[0], trackSection[1]);
    const h = getTagContent(xml, 'H', trackSection[0], trackSection[1]);

    const track: MemoryTrackSettings = {
      trackNumber: i as MemoryTrackSettings['trackNumber'],
    };

    if (a !== null) track.reverse = a === '1';
    if (b !== null) track.oneShot = b === '1';
    if (c !== null) track.pan = parseInt(c, 10);
    if (d !== null) track.level = parseInt(d, 10);
    if (e !== null) track.startMode = parseInt(e, 10);
    if (f !== null) track.stopMode = parseInt(f, 10);
    if (h !== null) track.fx = h === '1';

    tracks.push(track);
  }

  return tracks;
}

function parseMasterSettings(xml: string, memRange: [number, number]): MemoryMasterSettings | undefined {
  const masterSection = findSection(xml, 'MASTER', memRange[0], memRange[1]);
  if (!masterSection) return undefined;

  const a = getTagContent(xml, 'A', masterSection[0], masterSection[1]);
  if (a === null) return undefined;

  return { tempo: parseInt(a, 10) / 10 };
}

// ── Main Parser ─────────────────────────────────────────────────────

export function parseRC0(xml: string, slotNumber: number): MemoryConfig {
  const count = extractCount(xml);
  const mem = findSection(xml, 'mem');

  const name = mem ? decodePresetName(xml, mem) : '';
  const tracks = mem ? parseTrackSettings(xml, mem) : [];
  const master = mem ? parseMasterSettings(xml, mem) : undefined;

  const inputFx = parseFxSection(xml, 'ifx', 'ifx');
  const trackFx = parseFxSection(xml, 'tfx', 'tfx');

  return {
    version: 1,
    slotNumber,
    name,
    inputFx,
    trackFx,
    tracks: tracks.length > 0 ? tracks : undefined,
    master,
    count,
  };
}

export function parseRC0Pair(
  xmlA: string,
  xmlB: string,
  slotNumber: number,
): MemoryFilePair {
  const configA = parseRC0(xmlA, slotNumber);
  const configB = parseRC0(xmlB, slotNumber);

  const countA = parseHexCount(configA.count ?? '0000');
  const countB = parseHexCount(configB.count ?? '0000');

  const active = countB > countA ? 'b' : 'a';

  return { a: configA, b: configB, active };
}

export function parseRC0PairActive(
  xmlA: string,
  xmlB: string,
  slotNumber: number,
): MemoryConfig {
  const pair = parseRC0Pair(xmlA, xmlB, slotNumber);
  return pair.active === 'b' ? pair.b : pair.a;
}
