/**
 * @rc505mk2/lib — RC-505mk2 memory file generation, parsing, and FX parameter mapping.
 *
 * Main public API barrel export.
 */

// ── Types ──────────────────────────────────────────────────────────
export type {
  FxSlotId, FxParam, MemoryFxSlot, MemoryBank, MemoryFxSection,
  MemoryTrackSettings, MemoryMasterSettings, MemoryRecSettings,
  MemoryPlaySettings, MemoryRhythmSettings, MemoryConfig, MemoryFilePair,
} from './types/memory-config.js';

export type {
  FxSlotData, Tip, TrackSettings, MasterSettings,
  RecSettings, PlaySettings, RhythmSettings, PresetSettings, Rack, FxModule,
} from './types/rack.js';

// ── FX Names & Indexes ─────────────────────────────────────────────
export {
  RC0_FX_NAMES, RC0_SPECIAL_TRACK_FX_NAMES, SPECIAL_TRACK_FX,
  RC0_SEQ_FX_MAP, RC0_FX_NAME_LIST,
} from './fx/fx-names.js';
export type { RC0FxName, RC0SpecialTrackFxName, FxContext } from './fx/fx-names.js';

export {
  FX_INDEX_COMMON, FX_INDEX_IFX, FX_INDEX_TFX,
  resolveFxIndex, fxNameFromIndex,
} from './fx/fx-indexes.js';

export { FX_VALUE_TYPE, FREQ_RANGE, RATE_NOTE_VALUES, TIME_NOTE_VALUES } from './fx/fx-values.js';
export type { FxValueType } from './fx/fx-values.js';

// ── Parameter Transforms & Maps ────────────────────────────────────
export {
  num, eqGain, dynamicsType, reverbType, preampType, spkType, micType, micDis,
  distType, noteValue, keyValue, phaserStage, algoMode, twistRelease, rollSplit,
  octaveMode, isolatorBand, isolatorWave, oscWaveform, vocCarrier,
  hrmManualVoice, hrmAutoVoice, hrmAutoMode,
  beatScatterType, beatRepeatType, beatShiftType,
  onOff, lofiBitDepth, radioLoFi, electricScale,
  rateValue, stepRateValue, seqRate, seqMax,
  RATE_NOTE_DISPLAY,
} from './params/transforms.js';

export { PARAM_MAP, SEQ_TARGETS } from './params/param-map.js';
export type { ParamDef } from './params/param-map.js';

export { TRANSFORM_META } from './mcp/transform-meta.js';
export type { TransformMeta, TransformMetaEnum, TransformMetaNumeric } from './mcp/transform-meta.js';

export { EFFECT_NAME_MAP } from './params/effect-map.js';

// ── Generator ──────────────────────────────────────────────────────
export { findSection, queueEdit, applyEdits, getTagContent } from './generator/xml-ops.js';
export type { TextEdit } from './generator/xml-ops.js';

export {
  encodePresetName, generatePresetXml,
  rackToMemoryConfig, memoryConfigToRc0, memoryConfigToRc0Pair,
} from './generator/rc0-generator.js';

// ── Parser ─────────────────────────────────────────────────────────
export { parseHexCount, formatHexCount, extractCount } from './parser/hex-count.js';
export { parseRC0, parseRC0Pair, parseRC0PairActive } from './parser/rc0-parser.js';

// ── Download Utilities ─────────────────────────────────────────────
export {
  formatSlotNumber, generateReadmeText, remapRackToBank,
  buildCompositeConfig, generateMemoryReadme,
} from './download/rc0-download.js';
export type { BuilderBankState, BuilderExportState } from './download/rc0-download.js';

export { generatePresetZipBuffer, generateMemoryZipBuffer } from './download/rc0-zip.js';

// ── Config Utilities ──────────────────────────────────────────────
export { mergeMemoryConfigs } from './config/merge.js';
export {
  mergeParams, resolveSlotParams, computeOverrides,
  resolveSlot, isParamOverridden, recomputeSlotOverrides,
  resolveMemoryConfig, resolveRackPreset,
} from './config/resolve.js';

// ── Zod Schemas ──────────────────────────────────────────────────
export {
  FxSlotIdSchema, FxContextSchema, FxParamSchema,
  FxModuleSchema,
  FxSlotDataSchema, TipSchema, TrackSettingsSchema, MasterSettingsSchema,
  RecSettingsSchema, PlaySettingsSchema, RhythmSettingsSchema,
  PresetSettingsSchema, RackSchema,
  MemoryFxSlotSchema, MemoryBankSchema, MemoryFxSectionSchema,
  MemoryTrackSettingsSchema, MemoryMasterSettingsSchema,
  MemoryRecSettingsSchema, MemoryPlaySettingsSchema,
  MemoryRhythmSettingsSchema, MemoryConfigSchema, MemoryFilePairSchema,
  buildFxParamsSchema, validateFxModuleParams,
} from './schemas/index.js';

// ── Template ───────────────────────────────────────────────────────
export { getDefaultTemplate } from './template/template-loader.js';

// ── Data Access (for seeding / migration) ─────────────────────────
// FxModuleStore uses node:fs — import from '@rc505mk2/lib/node' instead.
export { loadBundledRacks } from './data/load-racks.js';

// ── Device Detection & Upload (Node.js only) ─────────────────────
// Import from '@rc505mk2/lib/node' for device functions:
//   detectDevice, uploadToDevice, checkDeviceSlot, DeviceInfo, UploadResult, UploadOptions
