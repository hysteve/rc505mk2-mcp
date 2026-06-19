/**
 * RC-505mk2 Parameter Mapping: config param names → RC0 tag letters.
 *
 * Names and order follow the Parameter Guide (pp 34-43).
 * Tag letters are assigned in guide-listed order (A=first, B=second, etc.)
 * and MUST be verified on device using the test harness.
 */

import {
  num, eqGain, rateValue, stepRateValue, seqRate, seqMax,
  dynamicsType, reverbType, preampType, spkType, micType, micDis,
  distType, noteValue, keyValue, phaserStage, algoMode, transposeSemi, pitchBendOct,
  centered50, centered10, compThreshold, compGain20, preampGainValue,
  oscVocOctave, duty, initPhase,
  lowCut, highCut, eqFreq, eqQ,
  delayTime, rollTime, reverbTime, preDelay, gateTime, density,
  eLevel120, feedback16, speed10,
  lofiSampleRate, oscBotNote, pattern20, phrase30, micPos,
  twistRelease, rollSplit, octaveMode, isolatorBand, isolatorWave,
  oscWaveform, vocCarrier, hrmManualVoice, hrmAutoVoice, hrmAutoMode,
  beatScatterType, beatRepeatType, beatShiftType, electricScale,
  onOff, lofiBitDepth, radioLoFi,
} from './transforms.js';
import {
  reverseNum, reverseEqGain, reverseRateValue, reverseStepRateValue,
  reverseSeqRate, reverseSeqMax,
  reverseDynamicsType, reverseReverbType, reversePreampType, reverseSpkType,
  reverseMicType, reverseMicDis, reverseDistType, reverseNoteValue,
  reverseKeyValue, reversePhaserStage, reverseAlgoMode, reverseTransposeSemi,
  reversePitchBendOct, reverseCentered50, reverseCentered10,
  reverseCompThreshold, reverseCompGain20, reversePreampGainValue,
  reverseOscVocOctave, reverseDuty, reverseInitPhase,
  reverseLowCut, reverseHighCut, reverseEqFreq, reverseEqQ,
  reverseDelayTime, reverseRollTime, reverseReverbTime, reversePreDelay,
  reverseGateTime, reverseDensity, reverseELevel120, reverseFeedback16,
  reverseSpeed10, reverseLofiSampleRate, reverseOscBotNote,
  reversePattern20, reversePhrase30, reverseMicPos,
  reverseTwistRelease, reverseRollSplit, reverseOctaveMode,
  reverseIsolatorBand, reverseIsolatorWave, reverseOscWaveform,
  reverseVocCarrier, reverseHrmManualVoice, reverseHrmAutoVoice,
  reverseHrmAutoMode, reverseBeatScatterType, reverseBeatRepeatType,
  reverseBeatShiftType, reverseElectricScale, reverseOnOff,
  reverseLofiBitDepth, reverseRadioLoFi,
} from './reverse-transforms.js';

export interface ParamDef {
  tag: string;
  transform?: (value: string) => number;
  reverse?: (rc0Value: number) => string;
}

// ── Sequencer helpers ───────────────────────────────────────────────

const SEQ_STEP_TAGS = "GHIJKLMNOPQRSTUV";

function makeSeqParams(): Record<string, ParamDef> {
  const steps: Record<string, ParamDef> = {};
  for (let i = 0; i < 16; i++) {
    steps[`STEP ${i + 1}`] = { tag: SEQ_STEP_TAGS[i], transform: num, reverse: reverseNum };
  }
  return {
    SW: { tag: "A", transform: onOff, reverse: reverseOnOff },
    SYNC: { tag: "B", transform: onOff, reverse: reverseOnOff },
    RETRIG: { tag: "C", transform: onOff, reverse: reverseOnOff },
    TARGET: { tag: "D", transform: num, reverse: reverseNum },
    "SEQ RATE": { tag: "E", transform: seqRate, reverse: reverseSeqRate },
    "SEQ MAX": { tag: "F", transform: seqMax, reverse: reverseSeqMax },
    ...steps,
  };
}

function makeSeqEntries(): Record<string, Record<string, ParamDef>> {
  const seqFx = [
    "LPF_SEQ", "BPF_SEQ", "HPF_SEQ",
    "PHASER_SEQ", "FLANGER_SEQ", "SYNTH_SEQ",
    "RING_MODULATOR_SEQ", "TRANSPOSE_SEQ", "PITCH_BEND_SEQ",
    "OSC_BOT_SEQ", "ISOLATOR_SEQ", "OCTAVE_SEQ",
    "MANUAL_PAN_SEQ", "TREMOLO_SEQ", "VIBRATO_SEQ",
  ];
  const result: Record<string, Record<string, ParamDef>> = {};
  for (const name of seqFx) {
    result[name] = makeSeqParams();
  }
  return result;
}

export const PARAM_MAP: Record<string, Record<string, ParamDef>> = {
  // ── Filters ──────────────────────────────────────────────────────
  LPF: {
    RATE: { tag: "A", transform: rateValue, reverse: reverseRateValue },
    DEPTH: { tag: "B", transform: num, reverse: reverseNum },
    RESONANCE: { tag: "C", transform: num, reverse: reverseNum },
    CUTOFF: { tag: "D", transform: num, reverse: reverseNum },
    "STEP RATE": { tag: "E", transform: stepRateValue, reverse: reverseStepRateValue },
  },
  BPF: {
    RATE: { tag: "A", transform: rateValue, reverse: reverseRateValue },
    DEPTH: { tag: "B", transform: num, reverse: reverseNum },
    RESONANCE: { tag: "C", transform: num, reverse: reverseNum },
    CUTOFF: { tag: "D", transform: num, reverse: reverseNum },
    "STEP RATE": { tag: "E", transform: stepRateValue, reverse: reverseStepRateValue },
  },
  HPF: {
    RATE: { tag: "A", transform: rateValue, reverse: reverseRateValue },
    DEPTH: { tag: "B", transform: num, reverse: reverseNum },
    RESONANCE: { tag: "C", transform: num, reverse: reverseNum },
    CUTOFF: { tag: "D", transform: num, reverse: reverseNum },
    "STEP RATE": { tag: "E", transform: stepRateValue, reverse: reverseStepRateValue },
  },

  // ── Modulation ───────────────────────────────────────────────────
  PHASER: {
    RATE: { tag: "A", transform: rateValue, reverse: reverseRateValue },
    DEPTH: { tag: "B", transform: num, reverse: reverseNum },
    RESONANCE: { tag: "C", transform: num, reverse: reverseNum },
    MANUAL: { tag: "D", transform: num, reverse: reverseNum },
    "STEP RATE": { tag: "G", transform: stepRateValue, reverse: reverseStepRateValue },
    "D.LEVEL": { tag: "E", transform: num, reverse: reverseNum },
    "E.LEVEL": { tag: "F", transform: num, reverse: reverseNum },
    STAGE: { tag: "H", transform: phaserStage, reverse: reversePhaserStage },
  },
  FLANGER: {
    RATE: { tag: "A", transform: rateValue, reverse: reverseRateValue },
    DEPTH: { tag: "B", transform: num, reverse: reverseNum },
    RESONANCE: { tag: "C", transform: num, reverse: reverseNum },
    MANUAL: { tag: "D", transform: num, reverse: reverseNum },
    "STEP RATE": { tag: "H", transform: stepRateValue, reverse: reverseStepRateValue },
    "D.LEVEL": { tag: "F", transform: num, reverse: reverseNum },
    "E.LEVEL": { tag: "G", transform: num, reverse: reverseNum },
    SEPARATION: { tag: "E", transform: num, reverse: reverseNum },
  },
  SYNTH: {
    FREQUENCY: { tag: "A", transform: num, reverse: reverseNum },
    RESONANCE: { tag: "B", transform: num, reverse: reverseNum },
    DECAY: { tag: "C", transform: num, reverse: reverseNum },
    BALANCE: { tag: "D", transform: num, reverse: reverseNum },
  },

  // ── Lo-Fi / Radio ────────────────────────────────────────────────
  LOFI: {
    BITDEPTH: { tag: "A", transform: lofiBitDepth, reverse: reverseLofiBitDepth },
    SAMPLERATE: { tag: "B", transform: lofiSampleRate, reverse: reverseLofiSampleRate },
    BALANCE: { tag: "D", transform: num, reverse: reverseNum },
  },
  RADIO: {
    "LO-FI": { tag: "A", transform: radioLoFi, reverse: reverseRadioLoFi },
    LEVEL: { tag: "B", transform: num, reverse: reverseNum },
  },

  // ── Ring Mod / G2B ───────────────────────────────────────────────
  RING_MODULATOR: {
    FREQUENCY: { tag: "A", transform: num, reverse: reverseNum },
    BALANCE: { tag: "B", transform: num, reverse: reverseNum },
    MODE: { tag: "C", transform: algoMode, reverse: reverseAlgoMode },
  },
  G2B: {
    BALANCE: { tag: "A", transform: num, reverse: reverseNum },
    MODE: { tag: "B", transform: algoMode, reverse: reverseAlgoMode },
  },

  // ── Sustainer ────────────────────────────────────────────────────
  SUSTAINER: {
    ATTACK: { tag: "B", transform: num, reverse: reverseNum },
    RELEASE: { tag: "C", transform: num, reverse: reverseNum },
    LEVEL: { tag: "F", transform: num, reverse: reverseNum },
    "LOW GAIN": { tag: "D", transform: eqGain, reverse: reverseEqGain },
    "HI GAIN": { tag: "E", transform: eqGain, reverse: reverseEqGain },
    SUSTAIN: { tag: "A", transform: num, reverse: reverseNum },
  },

  // ── Auto Riff ────────────────────────────────────────────────────
  AUTO_RIFF: {
    PHRASE: { tag: "A", transform: phrase30, reverse: reversePhrase30 },
    TEMPO: { tag: "B", transform: rateValue, reverse: reverseRateValue },
    HOLD: { tag: "C", transform: onOff, reverse: reverseOnOff },
    ATTACK: { tag: "D", transform: num, reverse: reverseNum },
    LOOP: { tag: "E", transform: onOff, reverse: reverseOnOff },
    KEY: { tag: "F", transform: keyValue, reverse: reverseKeyValue },
    BALANCE: { tag: "G", transform: num, reverse: reverseNum },
  },

  // ── Slow Gear ────────────────────────────────────────────────────
  SLOW_GEAR: {
    SENS: { tag: "A", transform: num, reverse: reverseNum },
    "RISE TIME": { tag: "B", transform: num, reverse: reverseNum },
    LEVEL: { tag: "C", transform: num, reverse: reverseNum },
    MODE: { tag: "D", transform: algoMode, reverse: reverseAlgoMode },
  },

  // ── Transpose ────────────────────────────────────────────────────
  TRANSPOSE: {
    TRANS: { tag: "A", transform: transposeSemi, reverse: reverseTransposeSemi },
    MODE: { tag: "B", transform: algoMode, reverse: reverseAlgoMode },
  },

  // ── Pitch Bend ───────────────────────────────────────────────────
  PITCH_BEND: {
    PITCH: { tag: "A", transform: pitchBendOct, reverse: reversePitchBendOct },
    BEND: { tag: "B", transform: num, reverse: reverseNum },
    MODE: { tag: "C", transform: algoMode, reverse: reverseAlgoMode },
  },

  // ── Robot ────────────────────────────────────────────────────────
  ROBOT: {
    NOTE: { tag: "A", transform: noteValue, reverse: reverseNoteValue },
    FORMANT: { tag: "B", transform: centered50, reverse: reverseCentered50 },
    MODE: { tag: "C", transform: algoMode, reverse: reverseAlgoMode },
  },

  // ── Electric ─────────────────────────────────────────────────────
  ELECTRIC: {
    SHIFT: { tag: "A", transform: transposeSemi, reverse: reverseTransposeSemi },
    FORMANT: { tag: "B", transform: centered50, reverse: reverseCentered50 },
    SPEED: { tag: "C", transform: speed10, reverse: reverseSpeed10 },
    STABILITY: { tag: "D", transform: centered10, reverse: reverseCentered10 },
    SCALE: { tag: "E", transform: electricScale, reverse: reverseElectricScale },
  },

  // ── Harmonist Manual ─────────────────────────────────────────────
  HARMONIST_MANUAL: {
    VOICE: { tag: "A", transform: hrmManualVoice, reverse: reverseHrmManualVoice },
    FORMANT: { tag: "B", transform: centered50, reverse: reverseCentered50 },
    PAN: { tag: "C", transform: centered50, reverse: reverseCentered50 },
    KEY: { tag: "D", transform: keyValue, reverse: reverseKeyValue },
    "D.LEVEL": { tag: "E", transform: num, reverse: reverseNum },
    "HRM LEVEL": { tag: "F", transform: num, reverse: reverseNum },
  },

  // ── Harmonist Auto ───────────────────────────────────────────────
  HARMONIST_AUTO: {
    VOICE: { tag: "A", transform: hrmAutoVoice, reverse: reverseHrmAutoVoice },
    FORMANT: { tag: "B", transform: centered50, reverse: reverseCentered50 },
    PAN: { tag: "C", transform: centered50, reverse: reverseCentered50 },
    "HRM MODE": { tag: "D", transform: hrmAutoMode, reverse: reverseHrmAutoMode },
    KEY: { tag: "E", transform: keyValue, reverse: reverseKeyValue },
    "D.LEVEL": { tag: "F", transform: num, reverse: reverseNum },
    "HRM LEVEL": { tag: "G", transform: num, reverse: reverseNum },
  },

  // ── Vocoder ──────────────────────────────────────────────────────
  VOCODER: {
    CARRIER: { tag: "A", transform: vocCarrier, reverse: reverseVocCarrier },
    TONE: { tag: "B", transform: centered50, reverse: reverseCentered50 },
    ATTACK: { tag: "C", transform: num, reverse: reverseNum },
    "MOD SENS": { tag: "D", transform: centered50, reverse: reverseCentered50 },
    "CARRIER THRU": { tag: "E", transform: onOff, reverse: reverseOnOff },
    BALANCE: { tag: "F", transform: num, reverse: reverseNum },
  },

  // ── OSC Vocoder ──────────────────────────────────────────────────
  OSC_VOCODER: {
    CARRIER: { tag: "A", transform: oscWaveform, reverse: reverseOscWaveform },
    TONE: { tag: "B", transform: centered50, reverse: reverseCentered50 },
    ATTACK: { tag: "C", transform: num, reverse: reverseNum },
    OCTAVE: { tag: "D", transform: oscVocOctave, reverse: reverseOscVocOctave },
    "MOD SENS": { tag: "E", transform: centered50, reverse: reverseCentered50 },
    RELEASE: { tag: "F", transform: num, reverse: reverseNum },
    BALANCE: { tag: "G", transform: num, reverse: reverseNum },
  },

  // ── OSC Bot ──────────────────────────────────────────────────────
  OSC_BOT: {
    OSC: { tag: "A", transform: oscWaveform, reverse: reverseOscWaveform },
    TONE: { tag: "B", transform: centered50, reverse: reverseCentered50 },
    ATTACK: { tag: "C", transform: num, reverse: reverseNum },
    NOTE: { tag: "D", transform: oscBotNote, reverse: reverseOscBotNote },
    "MOD SENS": { tag: "E", transform: centered50, reverse: reverseCentered50 },
    BALANCE: { tag: "F", transform: num, reverse: reverseNum },
  },

  // ── Preamp ───────────────────────────────────────────────────────
  PREAMP: {
    "AMP TYPE": { tag: "A", transform: preampType, reverse: reversePreampType },
    "SPK TYPE": { tag: "B", transform: spkType, reverse: reverseSpkType },
    GAIN: { tag: "C", transform: preampGainValue, reverse: reversePreampGainValue },
    "T-COMP": { tag: "D", transform: centered10, reverse: reverseCentered10 },
    BASS: { tag: "E", transform: num, reverse: reverseNum },
    MIDDLE: { tag: "F", transform: num, reverse: reverseNum },
    TREBLE: { tag: "G", transform: num, reverse: reverseNum },
    PRESENCE: { tag: "H", transform: num, reverse: reverseNum },
    "MIC TYPE": { tag: "I", transform: micType, reverse: reverseMicType },
    "MIC DIS": { tag: "J", transform: micDis, reverse: reverseMicDis },
    "MIC POS": { tag: "K", transform: micPos, reverse: reverseMicPos },
    "E.LEVEL": { tag: "L", transform: num, reverse: reverseNum },
  },

  // ── Dist ─────────────────────────────────────────────────────────
  DIST: {
    TYPE: { tag: "A", transform: distType, reverse: reverseDistType },
    TONE: { tag: "B", transform: centered50, reverse: reverseCentered50 },
    DIST: { tag: "C", transform: num, reverse: reverseNum },
    "D.LEVEL": { tag: "D", transform: num, reverse: reverseNum },
    "E.LEVEL": { tag: "E", transform: num, reverse: reverseNum },
  },

  // ── Dynamics ─────────────────────────────────────────────────────
  DYNAMICS: {
    TYPE: { tag: "A", transform: dynamicsType, reverse: reverseDynamicsType },
    DYNAMICS: { tag: "B", transform: eqGain, reverse: reverseEqGain },
  },

  // ── EQ ───────────────────────────────────────────────────────────
  EQ: {
    "LO GAIN": { tag: "A", transform: eqGain, reverse: reverseEqGain },
    "LO-MID GAIN": { tag: "B", transform: eqGain, reverse: reverseEqGain },
    "HI-MID GAIN": { tag: "C", transform: eqGain, reverse: reverseEqGain },
    "HI GAIN": { tag: "D", transform: eqGain, reverse: reverseEqGain },
    LEVEL: { tag: "E", transform: eqGain, reverse: reverseEqGain },
    "LO-MID FREQ": { tag: "F", transform: eqFreq, reverse: reverseEqFreq },
    "LO-MID Q": { tag: "G", transform: eqQ, reverse: reverseEqQ },
    "HI-MID FREQ": { tag: "H", transform: eqFreq, reverse: reverseEqFreq },
    "HI-MID Q": { tag: "I", transform: eqQ, reverse: reverseEqQ },
  },

  // ── Isolator ─────────────────────────────────────────────────────
  ISOLATOR: {
    BAND: { tag: "A", transform: isolatorBand, reverse: reverseIsolatorBand },
    RATE: { tag: "B", transform: rateValue, reverse: reverseRateValue },
    "BAND LEVEL": { tag: "C", transform: num, reverse: reverseNum },
    DEPTH: { tag: "D", transform: num, reverse: reverseNum },
    "STEP RATE": { tag: "E", transform: stepRateValue, reverse: reverseStepRateValue },
    WAVEFORM: { tag: "F", transform: isolatorWave, reverse: reverseIsolatorWave },
  },

  // ── Octave ───────────────────────────────────────────────────────
  OCTAVE: {
    OCTAVE: { tag: "A", transform: octaveMode, reverse: reverseOctaveMode },
    "OCT.LEVEL": { tag: "B", transform: num, reverse: reverseNum },
    MODE: { tag: "C", transform: algoMode, reverse: reverseAlgoMode },
  },

  // ── Auto Pan ─────────────────────────────────────────────────────
  AUTO_PAN: {
    RATE: { tag: "A", transform: rateValue, reverse: reverseRateValue },
    WAVEFORM: { tag: "B", transform: num, reverse: reverseNum },
    DEPTH: { tag: "C", transform: num, reverse: reverseNum },
    "INIT PHASE": { tag: "D", transform: initPhase, reverse: reverseInitPhase },
    "STEP RATE": { tag: "E", transform: stepRateValue, reverse: reverseStepRateValue },
  },

  // ── Manual Pan ───────────────────────────────────────────────────
  MANUAL_PAN: {
    POSITION: { tag: "A", transform: centered50, reverse: reverseCentered50 },
  },

  // ── Stereo Enhance ───────────────────────────────────────────────
  STEREO_ENHANCE: {
    "LOW CUT": { tag: "A", transform: lowCut, reverse: reverseLowCut },
    "HIGH CUT": { tag: "B", transform: highCut, reverse: reverseHighCut },
    ENHANCE: { tag: "C", transform: num, reverse: reverseNum },
  },

  // ── Tremolo ──────────────────────────────────────────────────────
  TREMOLO: {
    RATE: { tag: "A", transform: rateValue, reverse: reverseRateValue },
    DEPTH: { tag: "B", transform: num, reverse: reverseNum },
    WAVEFORM: { tag: "C", transform: num, reverse: reverseNum },
    LEVEL: { tag: "D", transform: num, reverse: reverseNum },
  },

  // ── Vibrato ──────────────────────────────────────────────────────
  VIBRATO: {
    RATE: { tag: "A", transform: rateValue, reverse: reverseRateValue },
    DEPTH: { tag: "B", transform: num, reverse: reverseNum },
    COLOR: { tag: "C", transform: num, reverse: reverseNum },
    "D.LEVEL": { tag: "D", transform: num, reverse: reverseNum },
    "E.LEVEL": { tag: "E", transform: num, reverse: reverseNum },
  },

  // ── Pattern Slicer ───────────────────────────────────────────────
  PATTERN_SLICER: {
    RATE: { tag: "A", transform: rateValue, reverse: reverseRateValue },
    DUTY: { tag: "B", transform: duty, reverse: reverseDuty },
    ATTACK: { tag: "C", transform: num, reverse: reverseNum },
    PATTERN: { tag: "D", transform: pattern20, reverse: reversePattern20 },
    DEPTH: { tag: "E", transform: num, reverse: reverseNum },
    "COMP THRESHOLD": { tag: "F", transform: compThreshold, reverse: reverseCompThreshold },
    "COMP GAIN": { tag: "G", transform: compGain20, reverse: reverseCompGain20 },
  },

  // ── Step Slicer ──────────────────────────────────────────────────
  STEP_SLICER: {
    RATE: { tag: "A", transform: rateValue, reverse: reverseRateValue },
    "STEP MAX": { tag: "B", transform: seqMax, reverse: reverseSeqMax },
    "STEP LEN 1": { tag: "C", transform: num, reverse: reverseNum },
    "STEP LEN 2": { tag: "D", transform: num, reverse: reverseNum },
    "STEP LEN 3": { tag: "E", transform: num, reverse: reverseNum },
    "STEP LEN 4": { tag: "F", transform: num, reverse: reverseNum },
    "STEP LEN 5": { tag: "G", transform: num, reverse: reverseNum },
    "STEP LEN 6": { tag: "H", transform: num, reverse: reverseNum },
    "STEP LEN 7": { tag: "I", transform: num, reverse: reverseNum },
    "STEP LEN 8": { tag: "J", transform: num, reverse: reverseNum },
    "STEP LEN 9": { tag: "K", transform: num, reverse: reverseNum },
    "STEP LEN 10": { tag: "L", transform: num, reverse: reverseNum },
    "STEP LEN 11": { tag: "M", transform: num, reverse: reverseNum },
    "STEP LEN 12": { tag: "N", transform: num, reverse: reverseNum },
    "STEP LEN 13": { tag: "O", transform: num, reverse: reverseNum },
    "STEP LEN 14": { tag: "P", transform: num, reverse: reverseNum },
    "STEP LEN 15": { tag: "Q", transform: num, reverse: reverseNum },
    "STEP LEN 16": { tag: "R", transform: num, reverse: reverseNum },
    "STEP LVL 1": { tag: "S", transform: num, reverse: reverseNum },
    "STEP LVL 2": { tag: "T", transform: num, reverse: reverseNum },
    "STEP LVL 3": { tag: "U", transform: num, reverse: reverseNum },
    "STEP LVL 4": { tag: "V", transform: num, reverse: reverseNum },
    "STEP LVL 5": { tag: "W", transform: num, reverse: reverseNum },
    "STEP LVL 6": { tag: "X", transform: num, reverse: reverseNum },
    "STEP LVL 7": { tag: "Y", transform: num, reverse: reverseNum },
    "STEP LVL 8": { tag: "Z", transform: num, reverse: reverseNum },
    "STEP LVL 9": { tag: "0", transform: num, reverse: reverseNum },
    "STEP LVL 10": { tag: "1", transform: num, reverse: reverseNum },
    "STEP LVL 11": { tag: "2", transform: num, reverse: reverseNum },
    "STEP LVL 12": { tag: "3", transform: num, reverse: reverseNum },
    "STEP LVL 13": { tag: "4", transform: num, reverse: reverseNum },
    "STEP LVL 14": { tag: "5", transform: num, reverse: reverseNum },
    "STEP LVL 15": { tag: "6", transform: num, reverse: reverseNum },
    "STEP LVL 16": { tag: "7", transform: num, reverse: reverseNum },
    DEPTH: { tag: "8", transform: num, reverse: reverseNum },
    "COMP THRESHOLD": { tag: "9", transform: compThreshold, reverse: reverseCompThreshold },
    "COMP GAIN": { tag: "#", transform: compGain20, reverse: reverseCompGain20 },
  },

  // ── Delays ───────────────────────────────────────────────────────
  DELAY: {
    TIME: { tag: "A", transform: delayTime, reverse: reverseDelayTime },
    FEEDBACK: { tag: "B", transform: feedback16, reverse: reverseFeedback16 },
    "D.LEVEL": { tag: "C", transform: num, reverse: reverseNum },
    "LOW CUT": { tag: "D", transform: lowCut, reverse: reverseLowCut },
    "HIGH CUT": { tag: "E", transform: highCut, reverse: reverseHighCut },
    "E.LEVEL": { tag: "F", transform: eLevel120, reverse: reverseELevel120 },
  },
  PANNING_DELAY: {
    TIME: { tag: "A", transform: delayTime, reverse: reverseDelayTime },
    FEEDBACK: { tag: "B", transform: feedback16, reverse: reverseFeedback16 },
    "D.LEVEL": { tag: "C", transform: num, reverse: reverseNum },
    "LOW CUT": { tag: "D", transform: lowCut, reverse: reverseLowCut },
    "HIGH CUT": { tag: "E", transform: highCut, reverse: reverseHighCut },
    "E.LEVEL": { tag: "F", transform: eLevel120, reverse: reverseELevel120 },
  },
  REVERSE_DELAY: {
    TIME: { tag: "A", transform: delayTime, reverse: reverseDelayTime },
    FEEDBACK: { tag: "B", transform: feedback16, reverse: reverseFeedback16 },
    "D.LEVEL": { tag: "C", transform: num, reverse: reverseNum },
    "LOW CUT": { tag: "D", transform: lowCut, reverse: reverseLowCut },
    "HIGH CUT": { tag: "E", transform: highCut, reverse: reverseHighCut },
    "E.LEVEL": { tag: "F", transform: eLevel120, reverse: reverseELevel120 },
  },
  MOD_DELAY: {
    TIME: { tag: "A", transform: delayTime, reverse: reverseDelayTime },
    FEEDBACK: { tag: "B", transform: feedback16, reverse: reverseFeedback16 },
    "MOD DEPTH": { tag: "C", transform: num, reverse: reverseNum },
    "D.LEVEL": { tag: "D", transform: num, reverse: reverseNum },
    "LOW CUT": { tag: "E", transform: lowCut, reverse: reverseLowCut },
    "HIGH CUT": { tag: "F", transform: highCut, reverse: reverseHighCut },
    "E.LEVEL": { tag: "G", transform: eLevel120, reverse: reverseELevel120 },
  },

  // ── Tape Echo ────────────────────────────────────────────────────
  TAPE_ECHO: {
    TIME: { tag: "A", transform: delayTime, reverse: reverseDelayTime },
    FEEDBACK: { tag: "B", transform: num, reverse: reverseNum },
    "D.LEVEL": { tag: "C", transform: num, reverse: reverseNum },
    "LOW CUT": { tag: "D", transform: lowCut, reverse: reverseLowCut },
    "HIGH CUT": { tag: "E", transform: highCut, reverse: reverseHighCut },
    "E.LEVEL": { tag: "F", transform: eLevel120, reverse: reverseELevel120 },
  },
  TAPE_ECHO_V505V2: {
    "REPEAT RATE": { tag: "A", transform: num, reverse: reverseNum },
    INTENSITY: { tag: "B", transform: num, reverse: reverseNum },
    "D.LEVEL": { tag: "C", transform: num, reverse: reverseNum },
    BASS: { tag: "D", transform: centered50, reverse: reverseCentered50 },
    TREBLE: { tag: "E", transform: centered50, reverse: reverseCentered50 },
    "E.LEVEL": { tag: "F", transform: eLevel120, reverse: reverseELevel120 },
  },

  // ── Granular Delay ───────────────────────────────────────────────
  GRANULAR_DELAY: {
    TIME: { tag: "A", transform: num, reverse: reverseNum },
    FEEDBACK: { tag: "B", transform: num, reverse: reverseNum },
    "E.LEVEL": { tag: "C", transform: num, reverse: reverseNum },
  },

  // ── Warp ─────────────────────────────────────────────────────────
  WARP: {
    LEVEL: { tag: "A", transform: num, reverse: reverseNum },
  },

  // ── Twist ────────────────────────────────────────────────────────
  TWIST: {
    RELEASE: { tag: "A", transform: twistRelease, reverse: reverseTwistRelease },
    RISE: { tag: "B", transform: num, reverse: reverseNum },
    FALL: { tag: "C", transform: num, reverse: reverseNum },
    LEVEL: { tag: "D", transform: num, reverse: reverseNum },
  },

  // ── Roll ─────────────────────────────────────────────────────────
  ROLL: {
    TIME: { tag: "A", transform: rollTime, reverse: reverseRollTime },
    REPEAT: { tag: "B", transform: num, reverse: reverseNum },
    ROLL: { tag: "C", transform: rollSplit, reverse: reverseRollSplit },
    BALANCE: { tag: "D", transform: num, reverse: reverseNum },
  },
  ROLL_V505V2: {
    TIME: { tag: "A", transform: rollTime, reverse: reverseRollTime },
    FEEDBACK: { tag: "B", transform: num, reverse: reverseNum },
    ROLL: { tag: "C", transform: rollSplit, reverse: reverseRollSplit },
    BALANCE: { tag: "D", transform: num, reverse: reverseNum },
  },

  // ── Freeze ───────────────────────────────────────────────────────
  FREEZE: {
    ATTACK: { tag: "A", transform: num, reverse: reverseNum },
    RELEASE: { tag: "B", transform: num, reverse: reverseNum },
    DECAY: { tag: "C", transform: num, reverse: reverseNum },
    SUSTAIN: { tag: "D", transform: num, reverse: reverseNum },
    BALANCE: { tag: "E", transform: num, reverse: reverseNum },
  },

  // ── Chorus ───────────────────────────────────────────────────────
  CHORUS: {
    RATE: { tag: "A", transform: rateValue, reverse: reverseRateValue },
    DEPTH: { tag: "B", transform: num, reverse: reverseNum },
    "LOW CUT": { tag: "C", transform: lowCut, reverse: reverseLowCut },
    "HIGH CUT": { tag: "D", transform: highCut, reverse: reverseHighCut },
    "D.LEVEL": { tag: "E", transform: num, reverse: reverseNum },
    "E.LEVEL": { tag: "F", transform: num, reverse: reverseNum },
  },

  // ── Reverbs ──────────────────────────────────────────────────────
  REVERB: {
    TIME: { tag: "A", transform: reverbTime, reverse: reverseReverbTime },
    "PRE DELAY": { tag: "B", transform: preDelay, reverse: reversePreDelay },
    DENSITY: { tag: "C", transform: density, reverse: reverseDensity },
    "LOW CUT": { tag: "D", transform: lowCut, reverse: reverseLowCut },
    "HIGH CUT": { tag: "E", transform: highCut, reverse: reverseHighCut },
    "D.LEVEL": { tag: "F", transform: num, reverse: reverseNum },
    "E.LEVEL": { tag: "G", transform: num, reverse: reverseNum },
  },
  GATE_REVERB: {
    TIME: { tag: "A", transform: reverbTime, reverse: reverseReverbTime },
    "PRE DELAY": { tag: "B", transform: preDelay, reverse: reversePreDelay },
    THRESHOLD: { tag: "C", transform: num, reverse: reverseNum },
    "LOW CUT": { tag: "D", transform: lowCut, reverse: reverseLowCut },
    "HIGH CUT": { tag: "E", transform: highCut, reverse: reverseHighCut },
    "D.LEVEL": { tag: "F", transform: num, reverse: reverseNum },
    "E.LEVEL": { tag: "G", transform: num, reverse: reverseNum },
  },
  REVERSE_REVERB: {
    TIME: { tag: "A", transform: reverbTime, reverse: reverseReverbTime },
    "PRE DELAY": { tag: "B", transform: preDelay, reverse: reversePreDelay },
    "GATE TIME": { tag: "C", transform: gateTime, reverse: reverseGateTime },
    "LOW CUT": { tag: "D", transform: lowCut, reverse: reverseLowCut },
    "HIGH CUT": { tag: "E", transform: highCut, reverse: reverseHighCut },
    "D.LEVEL": { tag: "F", transform: num, reverse: reverseNum },
    "E.LEVEL": { tag: "G", transform: num, reverse: reverseNum },
  },

  // ── Track FX only ────────────────────────────────────────────────
  BEAT_SCATTER: {
    TYPE: { tag: "A", transform: beatScatterType, reverse: reverseBeatScatterType },
    LENGTH: { tag: "B", transform: num, reverse: reverseNum },
  },
  BEAT_REPEAT: {
    TYPE: { tag: "A", transform: beatRepeatType, reverse: reverseBeatRepeatType },
    LENGTH: { tag: "B", transform: num, reverse: reverseNum },
  },
  BEAT_SHIFT: {
    TYPE: { tag: "A", transform: beatShiftType, reverse: reverseBeatShiftType },
    SHIFT: { tag: "B", transform: num, reverse: reverseNum },
  },
  VINYL_FLICK: {
    FLICK: { tag: "A", transform: num, reverse: reverseNum },
  },

  // ── FX Sequencers ────────────────────────────────────────────────
  ...makeSeqEntries(),
};

/**
 * Sequencer TARGET mapping: maps each _SEQ FX name → ordered list of main FX params
 * that can be modulated by the sequencer.
 *
 * TARGET value is a 0-based index into this array: 0 = first param, 1 = second, etc.
 * STEP 1-16 values use the same value type/range as the selected TARGET parameter.
 * For example, TRANSPOSE_SEQ target TRANS (index 0) → steps are -12 to +12.
 * FX with a single target always use TARGET=0.
 */
export const SEQ_TARGETS: Record<string, string[]> = {
  LPF_SEQ: ["DEPTH", "CUTOFF"],
  BPF_SEQ: ["DEPTH", "CUTOFF"],
  HPF_SEQ: ["DEPTH", "CUTOFF"],
  PHASER_SEQ: ["DEPTH", "RESONANCE", "MANUAL"],
  FLANGER_SEQ: ["DEPTH", "RESONANCE", "MANUAL", "D.LEVEL", "SEPARATION"],
  SYNTH_SEQ: ["FREQUENCY", "RESONANCE", "DECAY"],
  RING_MODULATOR_SEQ: ["FREQUENCY"],
  TRANSPOSE_SEQ: ["TRANS"],
  PITCH_BEND_SEQ: ["BEND"],
  OSC_BOT_SEQ: ["NOTE"],
  ISOLATOR_SEQ: ["DEPTH"],
  OCTAVE_SEQ: ["OCT.LEVEL"],
  MANUAL_PAN_SEQ: ["POSITION"],
  TREMOLO_SEQ: ["RATE", "WAVEFORM"],
  VIBRATO_SEQ: ["COLOR", "D.LEVEL", "E.LEVEL"],
};
