/**
 * RC-505mk2 Parameter Transform Functions
 *
 * Convert human-readable parameter values to RC0 numeric storage format.
 * All enum transforms fall back to num() for unrecognized/numeric input.
 */

/** Direct numeric pass-through */
export const num = (v: string): number => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : Math.round(n);
};

/** EQ gain: -20..+20 dB → RC0 range 0..40 (center = 20) */
export const eqGain = (v: string): number => {
  const n = parseInt(v, 10);
  if (isNaN(n)) return 20;
  return Math.max(0, Math.min(40, 20 + n));
};

/** DYNAMICS TYPE — 19+ compressor/limiter/utility types */
export const dynamicsType = (v: string): number => {
  const map: Record<string, number> = {
    NATURALCOMP: 0, "NATURAL COMP": 0,
    "MIXER COMP": 1, MIXERCOMP: 1,
    "LIVE COMP": 2, LIVECOMP: 2,
    "NATURAL LIM": 3, NATURALLIM: 3,
    "HARD LIM": 4, HARDLIM: 4,
    "JINGL COMP": 5, JINGLCOMP: 5,
    "HARD COMP": 6, HARDCOMP: 6,
    "SOFT COMP": 7, SOFTCOMP: 7,
    "CLEAN COMP": 8, CLEANCOMP: 8,
    "DANCE COMP": 9, DANCECOMP: 9,
    "ORCH COMP": 10, ORCHCOMP: 10,
    "VOCAL COMP": 11, VOCALCOMP: 11,
    ACOUSTIC: 12,
    "ROCK BAND": 13, ROCKBAND: 13,
    ORCHESTRA: 14,
    "LOW BOOST": 15, LOWBOOST: 15,
    BRIGHTEN: 16,
    "DJS VOICE": 17, DJSVOICE: 17,
    "PHONE VOX": 18, PHONEVOX: 18,
    COMP: 1, // Legacy alias
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** REVERB TYPE — 7 reverb algorithms */
export const reverbType = (v: string): number => {
  const map: Record<string, number> = {
    AMBIENCE: 0, ROOM: 1, HALL1: 2, HALL2: 3,
    PLATE: 4, SPRING: 5, MODULATE: 6,
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** PREAMP AMP TYPE — 9 amplifier models */
export const preampType = (v: string): number => {
  const map: Record<string, number> = {
    "JC-120": 0, JC120: 0,
    "NATURAL CLEAN": 1, NATURALCLEAN: 1,
    "FULL RANGE": 2, FULLRANGE: 2,
    "COMBO CRUNCH": 3, COMBOCRUNCH: 3,
    "STACK CRUNCH": 4, STACKCRUNCH: 4,
    "HIGAIN STACK": 5, HIGAINSTACK: 5,
    "POWER DRIVE": 6, POWERDRIVE: 6,
    "EXTREM LEAD": 7, EXTREMLEAD: 7,
    "CORE METAL": 8, COREMETAL: 8,
    // Legacy aliases
    NATURAL: 0, "JC CLEAN": 0, JCCLEAN: 0,
    "COMBO CRN": 3, COMBOCRN: 3,
    "STACK CRN": 4, STACKCRN: 4,
    "HI GAIN": 5, HIGAIN: 5,
    METAL: 8, "BASS AMP": 8, BASSAMP: 8,
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** PREAMP SPK TYPE — speaker cabinet types */
export const spkType = (v: string): number => {
  const map: Record<string, number> = {
    OFF: 0, ORIGINAL: 1,
    '1X8"': 2, "1X8": 2,
    '1X10"': 3, "1X10": 3,
    '1X12"': 4, "1X12": 4,
    '2X12"': 5, "2X12": 5,
    '4X10"': 6, "4X10": 6,
    '4X12"': 7, "4X12": 7,
    '8X12"': 8, "8X12": 8,
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** PREAMP MIC TYPE — device-verified labels */
export const micType = (v: string): number => {
  const map: Record<string, number> = {
    "DYN ST": 0, DYNST: 0, "DYN 57": 0, DYN57: 0,
    "DYN 421": 1, DYN421: 1,
    "CND 451": 2, CND451: 2,
    "CND 87": 3, CND87: 3,
    FLAT: 4,
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** PREAMP MIC DIS — mic distance */
export const micDis = (v: string): number => {
  const map: Record<string, number> = {
    "OFF MIC": 0, OFFMIC: 0,
    "ON MIC": 1, ONMIC: 1,
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** DIST TYPE — 6 distortion algorithms */
export const distType = (v: string): number => {
  const map: Record<string, number> = {
    VOCAL: 0, BOOST: 1, OD: 2, DS: 3, METAL: 4, FUZZ: 5,
    OVERDRIVE: 2, DISTORTION: 3, // Legacy aliases
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** Musical note — C through B (chromatic, 12 values) */
export const noteValue = (v: string): number => {
  const map: Record<string, number> = {
    C: 0, "C#": 1, DB: 1,
    D: 2, "D#": 3, EB: 3,
    E: 4, F: 5, "F#": 6, GB: 6,
    G: 7, "G#": 8, AB: 8,
    A: 9, "A#": 10, BB: 10, B: 11,
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** Musical key with relative minor — C(Am) through B(G#m) */
export const keyValue = (v: string): number => {
  const map: Record<string, number> = {
    "C (AM)": 0, "C(AM)": 0, C: 0,
    "C# (BBM)": 1, "C#(BBM)": 1, "C#": 1, DB: 1,
    "D (BM)": 2, "D(BM)": 2, D: 2,
    "EB (CM)": 3, "EB(CM)": 3, EB: 3, "D#": 3,
    "E (C#M)": 4, "E(C#M)": 4, E: 4,
    "F (DM)": 5, "F(DM)": 5, F: 5,
    "F# (D#M)": 6, "F#(D#M)": 6, "F# (EBM)": 6, "F#(EBM)": 6, "F#": 6, GB: 6,
    "G (EM)": 7, "G(EM)": 7, G: 7,
    "AB (FM)": 8, "AB(FM)": 8, AB: 8, "G#": 8,
    "A (F#M)": 9, "A(F#M)": 9, A: 9,
    "BB (GM)": 10, "BB(GM)": 10, BB: 10, "A#": 10,
    "B (G#M)": 11, "B(G#M)": 11, B: 11,
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** PHASER STAGE count */
export const phaserStage = (v: string): number => {
  const map: Record<string, number> = {
    "4": 0, "8": 1, "12": 2, "BI-PHASE": 3, BIPHASE: 3,
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** Centered -50..+50 → RC0 0..100 (center = 50)
 *  Used for: FORMANT, TONE, MOD SENS, PAN, POSITION, BASS/TREBLE (TAPE_ECHO_V505V2) */
export const centered50 = (v: string): number => {
  const n = parseInt(v, 10);
  if (isNaN(n)) return 50;
  return Math.max(0, Math.min(100, 50 + n));
};

/** Centered -10..+10 → RC0 0..20 (center = 10)
 *  Used for: ELECTRIC STABILITY, PREAMP T-COMP */
export const centered10 = (v: string): number => {
  const n = parseInt(v, 10);
  if (isNaN(n)) return 10;
  return Math.max(0, Math.min(20, 10 + n));
};

/** COMP THRESHOLD: -30..0 dB → RC0 0..30 (offset = 30) */
export const compThreshold = (v: string): number => {
  const n = parseInt(v, 10);
  if (isNaN(n)) return 30;
  return Math.max(0, Math.min(30, 30 + n));
};

/** COMP GAIN: 0..+20 dB → RC0 0..20 */
export const compGain20 = (v: string): number => {
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : Math.max(0, Math.min(20, n));
};

/** PREAMP GAIN: 0..120 → RC0 0..120 */
export const preampGainValue = (v: string): number => {
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : Math.max(0, Math.min(120, n));
};

/** OSC_VOCODER OCTAVE: -2OCT, -1OCT, 0, +1OCT → RC0 0..3 */
export const oscVocOctave = (v: string): number => {
  const map: Record<string, number> = {
    "-2OCT": 0, "-1OCT": 1, "0": 2, "+1OCT": 3,
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** PATTERN_SLICER DUTY: display 1-99, stored 0-98 (offset -1) */
export const duty = (v: string): number => {
  const n = parseInt(v, 10);
  if (isNaN(n)) return 49;
  return Math.max(0, Math.min(98, n - 1));
};

/** AUTO_PAN INIT PHASE: 0-180° in 15° steps → RC0 0..12 */
export const initPhase = (v: string): number => {
  const n = parseInt(v, 10);
  if (isNaN(n)) return 0;
  return Math.max(0, Math.min(12, Math.round(n / 15)));
};

/** TRANSPOSE TRANS: -12..+12 semitones → RC0 range 0..24 (center = 12) */
export const transposeSemi = (v: string): number => {
  const n = parseInt(v, 10);
  if (isNaN(n)) return 12; // default = 0 semitones
  return Math.max(0, Math.min(24, 12 + n));
};

/** PITCH BEND PITCH: -3..+4 octaves → RC0 range 0..7 (center = 3) */
export const pitchBendOct = (v: string): number => {
  const n = parseInt(v, 10);
  if (isNaN(n)) return 3; // default = 0 octaves
  return Math.max(0, Math.min(7, 3 + n));
};

/** Algorithm mode — 1 (previous RC series) / 2 (new), clamped 0-1 */
export const algoMode = (v: string): number => {
  const map: Record<string, number> = { "1": 0, "2": 1 };
  if (map[v] !== undefined) return map[v];
  return Math.max(0, Math.min(1, num(v)));
};

/** TWIST RELEASE type */
export const twistRelease = (v: string): number => {
  const map: Record<string, number> = { FALL: 0, FADE: 1 };
  return map[v.toUpperCase()] ?? num(v);
};

/** ROLL split values */
export const rollSplit = (v: string): number => {
  const map: Record<string, number> = {
    OFF: 0, "1/2": 1, "1/4": 2, "1/8": 3, "1/16": 4,
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** OCTAVE mode */
export const octaveMode = (v: string): number => {
  const map: Record<string, number> = {
    "-1OCT": 0, "-2OCT": 1, "-1OCT&-2OCT": 2,
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** ISOLATOR BAND selection */
export const isolatorBand = (v: string): number => {
  const map: Record<string, number> = { LOW: 0, MIDDLE: 1, HIGH: 2 };
  return map[v.toUpperCase()] ?? num(v);
};

/** ISOLATOR WAVEFORM */
export const isolatorWave = (v: string): number => {
  const map: Record<string, number> = { TRI: 0, SQR: 1 };
  return map[v.toUpperCase()] ?? num(v);
};

/** OSC waveform (OSC_VOCODER carrier, OSC_BOT oscillator) */
export const oscWaveform = (v: string): number => {
  const map: Record<string, number> = {
    SAW: 0, "VINTAGE SAW": 1, VINTAGESAW: 1,
    "DETUNE SAW": 2, DETUNESAW: 2, SQUARE: 3, RECT: 4,
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** VOCODER CARRIER source */
export const vocCarrier = (v: string): number => {
  const map: Record<string, number> = {
    MIC1: 0, MIC2: 1,
    "INST1-L": 2, "INST1-R": 3, "INST2-L": 4, "INST2-R": 5,
    TRACK1: 6, TRACK2: 7, TRACK3: 8, TRACK4: 9, TRACK5: 10,
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** HARMONIST MANUAL VOICE type — 11 values verified on device */
export const hrmManualVoice = (v: string): number => {
  const map: Record<string, number> = {
    "OCT-": 0, "-6TH": 1, "-5TH": 2, "-4TH": 3, "-3RD": 4,
    UNISON: 5, "+3RD": 6, "+4TH": 7, "+5TH": 8, "+6TH": 9, "OCT+": 10,
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** HARMONIST AUTO VOICE type — device-verified order */
export const hrmAutoVoice = (v: string): number => {
  const map: Record<string, number> = {
    "OCT-": 0, LOWER: 1, LOW: 2, UNISON: 3,
    HIGH: 4, HIGHER: 5, "OCT+": 6,
  };
  return map[v.toUpperCase()] ?? num(v);
};

/** HARMONIST AUTO HRM MODE */
export const hrmAutoMode = (v: string): number => {
  const map: Record<string, number> = { HYBRID: 0, AUTO: 1 };
  return map[v.toUpperCase()] ?? num(v);
};

/** BEAT SCATTER TYPE */
export const beatScatterType = (v: string): number => {
  const map: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };
  return map[v.toUpperCase()] ?? num(v);
};

/** BEAT REPEAT TYPE */
export const beatRepeatType = (v: string): number => {
  const map: Record<string, number> = { FORWARD: 0, REWIND: 1, MIX: 2 };
  return map[v.toUpperCase()] ?? num(v);
};

/** BEAT SHIFT TYPE */
export const beatShiftType = (v: string): number => {
  const map: Record<string, number> = { FUTURE: 0, PAST: 1 };
  return map[v.toUpperCase()] ?? num(v);
};

/** ON/OFF boolean — OFF=0, ON=1, clamped 0-1 */
export const onOff = (v: string): number => {
  const map: Record<string, number> = { OFF: 0, ON: 1 };
  if (map[v.toUpperCase()] !== undefined) return map[v.toUpperCase()];
  return Math.max(0, Math.min(1, num(v)));
};

/** LOFI BITDEPTH — inverted range: OFF=0, 31=1, 30=2, ..., 1=31 */
export const lofiBitDepth = (v: string): number => {
  if (v.toUpperCase() === "OFF") return 0;
  const n = parseInt(v, 10);
  if (isNaN(n) || n < 1 || n > 31) return num(v);
  return 32 - n;
};

/** RADIO LO-FI — display 1-10, stored 0-9 */
export const radioLoFi = (v: string): number => {
  const n = parseInt(v, 10);
  if (isNaN(n)) return num(v);
  return Math.max(0, Math.min(9, n - 1));
};

/** ELECTRIC SCALE — CHROMATIC or musical key */
export const electricScale = (v: string): number => {
  if (v.toUpperCase() === "CHROMATIC") return 0;
  return 1 + keyValue(v);
};

/** RATE value — tempo-synced rate parameter */
export const rateValue = (v: string): number => num(v);

/** STEP RATE value — stepped rate with OFF option */
export const stepRateValue = (v: string): number => num(v);

/** SEQ RATE — sequencer rate */
export const seqRate = (v: string): number => num(v);

/** SEQ MAX — sequencer step count 1-16, stored 0-indexed */
export const seqMax = (v: string): number => {
  const n = num(v);
  return Math.max(0, Math.min(15, n - 1));
};

// ── Frequency / Filter transforms ────────────────────────────────────

import { FREQ_RANGE } from '../fx/fx-values.js';

/** Normalize a frequency string to a canonical form for matching.
 *  Handles device format ("1.00 kHz"), old uppercase ("1.00K HZ"), etc. */
function normalizeFreq(s: string): string {
  return s.toUpperCase().replace(/\s+/g, '').replace(/HZ$/, ' HZ').replace(/K /, 'K');
}

/** FREQ_RANGE normalized for matching */
const FREQ_NORMALIZED = FREQ_RANGE.map(normalizeFreq);

function freqIndex(v: string): number {
  const idx = FREQ_NORMALIZED.indexOf(normalizeFreq(v));
  if (idx !== -1) return idx;
  return num(v);
}

/** LOW CUT: FLAT=0, freq index 1-29. Range "FLAT, 20.0 Hz - 12.5 kHz" */
export const lowCut = (v: string): number => {
  if (v.toUpperCase() === "FLAT") return 0;
  return Math.min(29, 1 + freqIndex(v));
};

/** HIGH CUT: freq index 0-28, FLAT=29. Range "20.0 Hz - 12.5 kHz, FLAT" */
export const highCut = (v: string): number => {
  if (v.toUpperCase() === "FLAT") return 29;
  return Math.min(28, freqIndex(v));
};

/** EQ FREQ: 20.0 Hz - 10.0 kHz → index 0-28 (into FREQ_VALUES) */
export const eqFreq = (v: string): number => {
  return Math.min(28, freqIndex(v));
};

/** EQ Q: 0.5, 1, 2, 4, 8, 16 → stored 0-5 */
export const eqQ = (v: string): number => {
  const map: Record<string, number> = {
    "0.5": 0, "1": 1, "2": 2, "4": 3, "8": 4, "16": 5,
  };
  return map[v] ?? num(v);
};

// ── Time-based transforms ────────────────────────────────────────────

/** Delay/roll TIME note value map (reversed order: longest → shortest) */
const TIME_NOTE_MAP: Record<string, number> = {
  "1/32": 0, "1/16": 1, "1/8T": 2, "1/8.": 3, "1/8": 4,
  "1/4T": 5, "1/4.": 6, "1/4": 7, "1/2T": 8, "1/2.": 9, "1/2": 10,
};

/** DELAY TIME: note values (0-10) + ms (xml 11 = 1ms → xml 2010 = 2000ms) */
export const delayTime = (v: string): number => {
  const upper = v.toUpperCase().trim();
  if (TIME_NOTE_MAP[upper] !== undefined) return TIME_NOTE_MAP[upper];
  // Strip "ms" suffix if present
  const ms = parseInt(upper.replace("MS", ""), 10);
  if (isNaN(ms)) return 211; // default ~200ms
  return Math.max(11, Math.min(2010, ms + 10));
};

/** ROLL TIME: note values (0-10) + ms (xml 11 = 1ms → xml 1010 = 1000ms) */
export const rollTime = (v: string): number => {
  const upper = v.toUpperCase().trim();
  if (TIME_NOTE_MAP[upper] !== undefined) return TIME_NOTE_MAP[upper];
  const ms = parseInt(upper.replace("MS", ""), 10);
  if (isNaN(ms)) return 211; // default ~200ms
  return Math.max(11, Math.min(1010, ms + 10));
};

/** REVERB TIME: 0.1-10.0s → RC0 1-100 (xml = seconds * 10) */
export const reverbTime = (v: string): number => {
  const n = parseFloat(v);
  if (isNaN(n)) return 30; // default 3.0s
  return Math.max(1, Math.min(100, Math.round(n * 10)));
};

/** REVERB PRE DELAY: 0-500 ms → RC0 0-500 (direct) */
export const preDelay = (v: string): number => {
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : Math.max(0, Math.min(500, n));
};

/** REVERSE_REVERB GATE TIME: 0.1-1.0s → RC0 1-10 (xml = seconds * 10) */
export const gateTime = (v: string): number => {
  const n = parseFloat(v);
  if (isNaN(n)) return 5; // default 0.5s
  return Math.max(1, Math.min(10, Math.round(n * 10)));
};

/** REVERB DENSITY: display 1-10, stored 0-9 */
export const density = (v: string): number => {
  const n = parseInt(v, 10);
  if (isNaN(n)) return 4; // default 5 display = 4 stored
  return Math.max(0, Math.min(9, n - 1));
};

// ── Bounded numeric transforms ───────────────────────────────────────

/** E.LEVEL for delay-type FX: 0-120 */
export const eLevel120 = (v: string): number => {
  const n = parseInt(v, 10);
  return isNaN(n) ? 50 : Math.max(0, Math.min(120, n));
};

/** DELAY FEEDBACK: 1-16 */
export const feedback16 = (v: string): number => {
  const n = parseInt(v, 10);
  return isNaN(n) ? 1 : Math.max(1, Math.min(16, n));
};

/** ELECTRIC SPEED: 0-10 */
export const speed10 = (v: string): number => {
  const n = parseInt(v, 10);
  return isNaN(n) ? 5 : Math.max(0, Math.min(10, n));
};

// ── Index/enum transforms ────────────────────────────────────────────

/** LOFI SAMPLERATE: OFF=0, 1/2=1, 1/3=2, ..., 1/32=31 */
export const lofiSampleRate = (v: string): number => {
  if (v.toUpperCase() === "OFF") return 0;
  // Accept "1/N" format
  const match = v.match(/^1\/(\d+)$/);
  if (match) {
    const denom = parseInt(match[1], 10);
    if (denom >= 2 && denom <= 32) return denom - 1;
  }
  return num(v);
};

/** OSC_BOT NOTE: C1-G9 (note + octave) → RC0 0-103
 *  C1=0, C#1=1, ..., B1=11, C2=12, ..., G9=103 */
export const oscBotNote = (v: string): number => {
  const match = v.toUpperCase().match(/^([A-G][#B]?)(\d)$/);
  if (!match) return num(v);
  const noteMap: Record<string, number> = {
    C: 0, "C#": 1, DB: 1,
    D: 2, "D#": 3, EB: 3,
    E: 4, F: 5, "F#": 6, GB: 6,
    G: 7, "G#": 8, AB: 8,
    A: 9, "A#": 10, BB: 10, B: 11,
  };
  const note = noteMap[match[1]];
  const octave = parseInt(match[2], 10);
  if (note === undefined || octave < 1 || octave > 9) return num(v);
  const result = (octave - 1) * 12 + note;
  return Math.max(0, Math.min(103, result));
};

/** PATTERN_SLICER PATTERN: P01-P20 → stored 0-19 */
export const pattern20 = (v: string): number => {
  const match = v.toUpperCase().match(/^P?0?(\d+)$/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 1 && n <= 20) return n - 1;
  }
  return num(v);
};

/** AUTO_RIFF PHRASE: P1-P30 → stored 0-29 */
export const phrase30 = (v: string): number => {
  const match = v.toUpperCase().match(/^P?0?(\d+)$/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 1 && n <= 30) return n - 1;
  }
  return num(v);
};

/** PREAMP MIC POS: CENTER=0, 1cm-10cm → stored 0-10 */
export const micPos = (v: string): number => {
  if (v.toUpperCase() === "CENTER") return 0;
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : Math.max(0, Math.min(10, n));
};

/** Note value display names in stored order (longest → shortest) */
export const RATE_NOTE_DISPLAY = [
  "1/2", "1/2.", "1/2T",
  "1/4", "1/4.", "1/4T",
  "1/8", "1/8.", "1/8T",
  "1/16", "1/32",
];
