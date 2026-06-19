/**
 * RC-505mk2 Reverse Transform Functions
 *
 * Convert RC0 numeric storage values back to human-readable display strings.
 * Each function is the inverse of its corresponding forward transform in transforms.ts.
 */

// ── Shared data ─────────────────────────────────────────────────────

import { FREQ_RANGE as FREQ_VALUES } from '../fx/fx-values.js';

/** Time note values in RC0 order (index → display) */
const TIME_NOTE_REVERSE: Record<number, string> = {
  0: '1/32', 1: '1/16', 2: '1/8T', 3: '1/8.', 4: '1/8',
  5: '1/4T', 6: '1/4.', 7: '1/4', 8: '1/2T', 9: '1/2.', 10: '1/2',
};

// ── Helper: build reverse enum from canonical values list ───────────

function reverseEnum(values: readonly string[]): (rc0: number) => string {
  return (rc0: number): string => values[rc0] ?? String(rc0);
}

// ── Direct numeric ──────────────────────────────────────────────────

/** num: pass-through (RC0 = display) */
export const reverseNum = (rc0: number): string => String(rc0);

// ── Centered/offset ranges ─────────────────────────────────────────

/** eqGain: RC0 0..40 → display -20..+20 */
export const reverseEqGain = (rc0: number): string => String(rc0 - 20);

/** centered50: RC0 0..100 → display -50..+50 */
export const reverseCentered50 = (rc0: number): string => String(rc0 - 50);

/** centered10: RC0 0..20 → display -10..+10 */
export const reverseCentered10 = (rc0: number): string => String(rc0 - 10);

/** transposeSemi: RC0 0..24 → display -12..+12 */
export const reverseTransposeSemi = (rc0: number): string => String(rc0 - 12);

/** pitchBendOct: RC0 0..7 → display -3..+4 */
export const reversePitchBendOct = (rc0: number): string => String(rc0 - 3);

/** compThreshold: RC0 0..30 → display -30..0 */
export const reverseCompThreshold = (rc0: number): string => String(rc0 - 30);

/** compGain20: RC0 0..20 → display 0..20 (identity) */
export const reverseCompGain20 = (rc0: number): string => String(rc0);

/** preampGainValue: RC0 0..120 → display 0..120 (identity) */
export const reversePreampGainValue = (rc0: number): string => String(rc0);

// ── Bounded numeric (identity) ─────────────────────────────────────

/** eLevel120: RC0 0..120 → display 0..120 */
export const reverseELevel120 = (rc0: number): string => String(rc0);

/** feedback16: RC0 1..16 → display 1..16 */
export const reverseFeedback16 = (rc0: number): string => String(rc0);

/** speed10: RC0 0..10 → display 0..10 */
export const reverseSpeed10 = (rc0: number): string => String(rc0);

/** preDelay: RC0 0..500 → display 0..500 */
export const reversePreDelay = (rc0: number): string => String(rc0);

// ── Rate/sequencer (identity) ──────────────────────────────────────

/** rateValue / stepRateValue / seqRate: pass-through */
export const reverseRateValue = (rc0: number): string => String(rc0);
export const reverseStepRateValue = (rc0: number): string => String(rc0);
export const reverseSeqRate = (rc0: number): string => String(rc0);

/** seqMax: RC0 0..15 → display 1..16 */
export const reverseSeqMax = (rc0: number): string => String(rc0 + 1);

// ── Offset-by-one transforms ───────────────────────────────────────

/** density: RC0 0..9 → display 1..10 */
export const reverseDensity = (rc0: number): string => String(rc0 + 1);

/** duty: RC0 0..98 → display 1..99 */
export const reverseDuty = (rc0: number): string => String(rc0 + 1);

/** radioLoFi: RC0 0..9 → display 1..10 */
export const reverseRadioLoFi = (rc0: number): string => String(rc0 + 1);

// ── Scaled transforms ──────────────────────────────────────────────

/** reverbTime: RC0 1..100 → display 0.1..10.0 (divide by 10) */
export const reverseReverbTime = (rc0: number): string => (rc0 / 10).toFixed(1);

/** gateTime: RC0 1..10 → display 0.1..1.0 (divide by 10) */
export const reverseGateTime = (rc0: number): string => (rc0 / 10).toFixed(1);

/** initPhase: RC0 0..12 → display 0..180 (multiply by 15) */
export const reverseInitPhase = (rc0: number): string => String(rc0 * 15);

// ── Time-based transforms ──────────────────────────────────────────

/** delayTime: RC0 0-10 = note values, RC0 11+ = ms (rc0 - 10) */
export const reverseDelayTime = (rc0: number): string => {
  if (rc0 <= 10) return TIME_NOTE_REVERSE[rc0] ?? String(rc0);
  return String(rc0 - 10);
};

/** rollTime: RC0 0-10 = note values, RC0 11+ = ms (rc0 - 10) */
export const reverseRollTime = (rc0: number): string => {
  if (rc0 <= 10) return TIME_NOTE_REVERSE[rc0] ?? String(rc0);
  return String(rc0 - 10);
};

// ── Frequency/filter transforms ────────────────────────────────────

/** lowCut: RC0 0=FLAT, 1-29 = FREQ_VALUES[0..28] */
export const reverseLowCut = (rc0: number): string => {
  if (rc0 === 0) return 'FLAT';
  return FREQ_VALUES[rc0 - 1] ?? String(rc0);
};

/** highCut: RC0 29=FLAT, 0-28 = FREQ_VALUES[0..28] */
export const reverseHighCut = (rc0: number): string => {
  if (rc0 === 29) return 'FLAT';
  return FREQ_VALUES[rc0] ?? String(rc0);
};

/** eqFreq: RC0 0..28 → FREQ_VALUES[0..28] */
export const reverseEqFreq = (rc0: number): string => FREQ_VALUES[rc0] ?? String(rc0);

/** eqQ: RC0 0..5 → 0.5, 1, 2, 4, 8, 16 */
const EQ_Q_VALUES = ['0.5', '1', '2', '4', '8', '16'];
export const reverseEqQ = (rc0: number): string => EQ_Q_VALUES[rc0] ?? String(rc0);

// ── Enum transforms ────────────────────────────────────────────────

/** dynamicsType: 19 compressor/limiter types */
export const reverseDynamicsType = reverseEnum([
  'NATURAL COMP', 'MIXER COMP', 'LIVE COMP', 'NATURAL LIM', 'HARD LIM',
  'JINGL COMP', 'HARD COMP', 'SOFT COMP', 'CLEAN COMP', 'DANCE COMP',
  'ORCH COMP', 'VOCAL COMP', 'ACOUSTIC', 'ROCK BAND', 'ORCHESTRA',
  'LOW BOOST', 'BRIGHTEN', 'DJS VOICE', 'PHONE VOX',
]);

/** reverbType: 7 reverb algorithms */
export const reverseReverbType = reverseEnum([
  'AMBIENCE', 'ROOM', 'HALL1', 'HALL2', 'PLATE', 'SPRING', 'MODULATE',
]);

/** preampType: 9 amp models */
export const reversePreampType = reverseEnum([
  'JC-120', 'NATURAL CLEAN', 'FULL RANGE', 'COMBO CRUNCH', 'STACK CRUNCH',
  'HIGAIN STACK', 'POWER DRIVE', 'EXTREM LEAD', 'CORE METAL',
]);

/** spkType: 9 speaker cabinet types */
export const reverseSpkType = reverseEnum([
  'OFF', 'ORIGINAL', '1X8"', '1X10"', '1X12"', '2X12"', '4X10"', '4X12"', '8X12"',
]);

/** micType: 5 mic models (canonical display labels) */
export const reverseMicType = reverseEnum([
  'DYN ST', 'DYN 421', 'CND 451', 'CND 87', 'FLAT',
]);

/** micDis: 2 mic distance values */
export const reverseMicDis = reverseEnum(['OFF MIC', 'ON MIC']);

/** distType: 6 distortion algorithms */
export const reverseDistType = reverseEnum([
  'VOCAL', 'BOOST', 'OD', 'DS', 'METAL', 'FUZZ',
]);

/** noteValue: 12 chromatic notes */
export const reverseNoteValue = reverseEnum([
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
]);

/** keyValue: 12 musical keys (canonical display form) */
export const reverseKeyValue = reverseEnum([
  'C', 'C#', 'D', 'EB', 'E', 'F', 'F#', 'G', 'AB', 'A', 'BB', 'B',
]);

/** phaserStage: 4 values */
export const reversePhaserStage = reverseEnum(['4', '8', '12', 'BI-PHASE']);

/** algoMode: 2 values */
export const reverseAlgoMode = reverseEnum(['1', '2']);

/** onOff: 2 values */
export const reverseOnOff = reverseEnum(['OFF', 'ON']);

/** oscVocOctave: 4 values */
export const reverseOscVocOctave = reverseEnum(['-2OCT', '-1OCT', '0', '+1OCT']);

/** twistRelease: 2 values */
export const reverseTwistRelease = reverseEnum(['FALL', 'FADE']);

/** rollSplit: 5 values */
export const reverseRollSplit = reverseEnum(['OFF', '1/2', '1/4', '1/8', '1/16']);

/** octaveMode: 3 values */
export const reverseOctaveMode = reverseEnum(['-1OCT', '-2OCT', '-1OCT&-2OCT']);

/** isolatorBand: 3 values */
export const reverseIsolatorBand = reverseEnum(['LOW', 'MIDDLE', 'HIGH']);

/** isolatorWave: 2 values */
export const reverseIsolatorWave = reverseEnum(['TRI', 'SQR']);

/** oscWaveform: 5 values */
export const reverseOscWaveform = reverseEnum([
  'SAW', 'VINTAGE SAW', 'DETUNE SAW', 'SQUARE', 'RECT',
]);

/** vocCarrier: 11 carrier sources */
export const reverseVocCarrier = reverseEnum([
  'MIC1', 'MIC2', 'INST1-L', 'INST1-R', 'INST2-L', 'INST2-R',
  'TRACK1', 'TRACK2', 'TRACK3', 'TRACK4', 'TRACK5',
]);

/** hrmManualVoice: 11 intervals */
export const reverseHrmManualVoice = reverseEnum([
  'OCT-', '-6TH', '-5TH', '-4TH', '-3RD', 'UNISON',
  '+3RD', '+4TH', '+5TH', '+6TH', 'OCT+',
]);

/** hrmAutoVoice: 7 voice ranges */
export const reverseHrmAutoVoice = reverseEnum([
  'OCT-', 'LOWER', 'LOW', 'UNISON', 'HIGH', 'HIGHER', 'OCT+',
]);

/** hrmAutoMode: 2 modes */
export const reverseHrmAutoMode = reverseEnum(['HYBRID', 'AUTO']);

/** beatScatterType: 4 patterns */
export const reverseBeatScatterType = reverseEnum(['P1', 'P2', 'P3', 'P4']);

/** beatRepeatType: 3 directions */
export const reverseBeatRepeatType = reverseEnum(['FORWARD', 'REWIND', 'MIX']);

/** beatShiftType: 2 directions */
export const reverseBeatShiftType = reverseEnum(['FUTURE', 'PAST']);

// ── Special transforms ─────────────────────────────────────────────

/** lofiBitDepth: RC0 0=OFF, else display = 32 - rc0 */
export const reverseLofiBitDepth = (rc0: number): string => {
  if (rc0 === 0) return 'OFF';
  return String(32 - rc0);
};

/** lofiSampleRate: RC0 0=OFF, else display = 1/(rc0+1) */
export const reverseLofiSampleRate = (rc0: number): string => {
  if (rc0 === 0) return 'OFF';
  return `1/${rc0 + 1}`;
};

/** oscBotNote: RC0 0..103 → note+octave (C1 through G9) */
export const reverseOscBotNote = (rc0: number): string => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(rc0 / 12) + 1;
  const note = notes[rc0 % 12];
  return `${note}${octave}`;
};

/** pattern20: RC0 0..19 → P01..P20 */
export const reversePattern20 = (rc0: number): string => {
  const n = rc0 + 1;
  return `P${String(n).padStart(2, '0')}`;
};

/** phrase30: RC0 0..29 → P1..P30 */
export const reversePhrase30 = (rc0: number): string => `P${rc0 + 1}`;

/** micPos: RC0 0=CENTER, 1-10=cm */
export const reverseMicPos = (rc0: number): string => {
  if (rc0 === 0) return 'CENTER';
  return String(rc0);
};

/** electricScale: RC0 0=CHROMATIC, 1-12=keyValue */
export const reverseElectricScale = (rc0: number): string => {
  if (rc0 === 0) return 'CHROMATIC';
  return reverseKeyValue(rc0 - 1);
};
