/**
 * Transform metadata — maps each transform function to its human-readable
 * type info (enum values or numeric range) for the lookup_fx_params tool.
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
} from '../params/transforms.js';

export interface TransformMetaEnum {
  type: 'enum';
  values: string[];
  description?: string;
}

export interface TransformMetaNumeric {
  type: 'numeric';
  range: { min: number; max: number };
  unit?: string;
  noteValues?: string[];
  description?: string;
}

export type TransformMeta = TransformMetaEnum | TransformMetaNumeric;

/**
 * Map from transform function reference → metadata about accepted values.
 * Used by lookup_fx_params to tell the LLM what values are valid.
 */
export const TRANSFORM_META = new Map<((v: string) => number) | undefined, TransformMeta>([
  // ── Generic numeric ─────────────────────────────────────────────
  [num, { type: 'numeric', range: { min: 0, max: 100 }, description: 'Direct numeric value' }],

  // ── Centered/offset ranges ──────────────────────────────────────
  [eqGain, { type: 'numeric', range: { min: -20, max: 20 }, unit: 'dB', description: 'EQ gain in dB' }],
  [transposeSemi, { type: 'numeric', range: { min: -12, max: 12 }, unit: 'st', description: 'Transpose in semitones' }],
  [pitchBendOct, { type: 'numeric', range: { min: -3, max: 4 }, unit: 'oct', description: 'Pitch bend in octaves' }],
  [centered50, { type: 'numeric', range: { min: -50, max: 50 }, description: 'Centered value (formant, tone, mod sens, pan)' }],
  [centered10, { type: 'numeric', range: { min: -10, max: 10 }, description: 'Centered value (stability, t-comp)' }],
  [compThreshold, { type: 'numeric', range: { min: -30, max: 0 }, unit: 'dB', description: 'Compressor threshold in dB' }],
  [compGain20, { type: 'numeric', range: { min: 0, max: 20 }, unit: 'dB', description: 'Compressor gain in dB' }],

  // ── Bounded numeric ranges ──────────────────────────────────────
  [preampGainValue, { type: 'numeric', range: { min: 0, max: 120 }, description: 'Preamp gain' }],
  [eLevel120, { type: 'numeric', range: { min: 0, max: 120 }, description: 'Effect level (delay-type)' }],
  [feedback16, { type: 'numeric', range: { min: 1, max: 16 }, description: 'Delay feedback repeats' }],
  [speed10, { type: 'numeric', range: { min: 0, max: 10 }, description: 'Speed (0-10)' }],
  [density, { type: 'numeric', range: { min: 1, max: 10 }, description: 'Reverb density' }],
  [duty, { type: 'numeric', range: { min: 1, max: 99 }, unit: '%', description: 'Pattern slicer duty cycle' }],
  [initPhase, { type: 'numeric', range: { min: 0, max: 180 }, unit: '°', description: 'Initial phase in degrees (steps of 15)' }],

  // ── Time-based ──────────────────────────────────────────────────
  [delayTime, { type: 'numeric', range: { min: 1, max: 2000 }, unit: 'ms', noteValues: ['1/32', '1/16', '1/8T', '1/8.', '1/8', '1/4T', '1/4.', '1/4', '1/2T', '1/2.', '1/2'], description: 'Delay time in ms (1-2000) or note value' }],
  [rollTime, { type: 'numeric', range: { min: 1, max: 1000 }, unit: 'ms', noteValues: ['1/32', '1/16', '1/8T', '1/8.', '1/8', '1/4T', '1/4.', '1/4', '1/2T', '1/2.', '1/2'], description: 'Roll time in ms (1-1000) or note value' }],
  [reverbTime, { type: 'numeric', range: { min: 0.1, max: 10.0 }, unit: 's', description: 'Reverb time in seconds' }],
  [preDelay, { type: 'numeric', range: { min: 0, max: 500 }, unit: 'ms', description: 'Pre-delay in ms' }],
  [gateTime, { type: 'numeric', range: { min: 0.1, max: 1.0 }, unit: 's', description: 'Gate time in seconds' }],

  // ── Rate/sequencer ──────────────────────────────────────────────
  [rateValue, { type: 'numeric', range: { min: 0, max: 100 }, description: 'Rate (0-100) or note value' }],
  [stepRateValue, { type: 'numeric', range: { min: 0, max: 100 }, description: 'Step rate (0=OFF, then tempo-synced)' }],
  [seqRate, { type: 'numeric', range: { min: 0, max: 100 }, description: 'Sequencer rate' }],
  [seqMax, { type: 'numeric', range: { min: 1, max: 16 }, description: 'Sequencer step count' }],

  // ── Frequency/filter enums ──────────────────────────────────────
  [lowCut, {
    type: 'enum',
    values: ['FLAT', '20.0 Hz', '25.0 Hz', '31.5 Hz', '40.0 Hz', '50.0 Hz', '63.0 Hz', '80.0 Hz', '100 Hz', '125 Hz', '160 Hz', '200 Hz', '250 Hz', '315 Hz', '400 Hz', '500 Hz', '630 Hz', '800 Hz', '1.00k Hz', '1.25k Hz', '1.60k Hz', '2.00k Hz', '2.50k Hz', '3.15k Hz', '4.00k Hz', '5.00k Hz', '6.30k Hz', '8.00k Hz', '10.0k Hz', '12.5k Hz'],
    description: 'Low cut filter frequency (FLAT = no filter)',
  }],
  [highCut, {
    type: 'enum',
    values: ['20.0 Hz', '25.0 Hz', '31.5 Hz', '40.0 Hz', '50.0 Hz', '63.0 Hz', '80.0 Hz', '100 Hz', '125 Hz', '160 Hz', '200 Hz', '250 Hz', '315 Hz', '400 Hz', '500 Hz', '630 Hz', '800 Hz', '1.00k Hz', '1.25k Hz', '1.60k Hz', '2.00k Hz', '2.50k Hz', '3.15k Hz', '4.00k Hz', '5.00k Hz', '6.30k Hz', '8.00k Hz', '10.0k Hz', '12.5k Hz', 'FLAT'],
    description: 'High cut filter frequency (FLAT = no filter)',
  }],
  [eqFreq, {
    type: 'enum',
    values: ['20.0 Hz', '25.0 Hz', '31.5 Hz', '40.0 Hz', '50.0 Hz', '63.0 Hz', '80.0 Hz', '100 Hz', '125 Hz', '160 Hz', '200 Hz', '250 Hz', '315 Hz', '400 Hz', '500 Hz', '630 Hz', '800 Hz', '1.00k Hz', '1.25k Hz', '1.60k Hz', '2.00k Hz', '2.50k Hz', '3.15k Hz', '4.00k Hz', '5.00k Hz', '6.30k Hz', '8.00k Hz', '10.0k Hz', '12.5k Hz'],
    description: 'EQ center frequency',
  }],
  [eqQ, {
    type: 'enum',
    values: ['0.5', '1', '2', '4', '8', '16'],
    description: 'EQ Q factor (bandwidth)',
  }],

  // ── FX type enums ───────────────────────────────────────────────
  [dynamicsType, {
    type: 'enum',
    values: ['NATURAL COMP', 'MIXER COMP', 'LIVE COMP', 'NATURAL LIM', 'HARD LIM', 'JINGL COMP', 'HARD COMP', 'SOFT COMP', 'CLEAN COMP', 'DANCE COMP', 'ORCH COMP', 'VOCAL COMP', 'ACOUSTIC', 'ROCK BAND', 'ORCHESTRA', 'LOW BOOST', 'BRIGHTEN', 'DJS VOICE', 'PHONE VOX'],
    description: 'Compressor/limiter algorithm',
  }],
  [reverbType, {
    type: 'enum',
    values: ['AMBIENCE', 'ROOM', 'HALL1', 'HALL2', 'PLATE', 'SPRING', 'MODULATE'],
    description: 'Reverb algorithm',
  }],
  [preampType, {
    type: 'enum',
    values: ['JC-120', 'NATURAL CLEAN', 'FULL RANGE', 'COMBO CRUNCH', 'STACK CRUNCH', 'HIGAIN STACK', 'POWER DRIVE', 'EXTREM LEAD', 'CORE METAL'],
    description: 'Amplifier model',
  }],
  [spkType, {
    type: 'enum',
    values: ['OFF', 'ORIGINAL', '1X8"', '1X10"', '1X12"', '2X12"', '4X10"', '4X12"', '8X12"'],
    description: 'Speaker cabinet type',
  }],
  [micType, {
    type: 'enum',
    values: ['DYN ST', 'DYN 421', 'CND 451', 'CND 87', 'FLAT'],
    description: 'Microphone model',
  }],
  [micDis, {
    type: 'enum',
    values: ['OFF MIC', 'ON MIC'],
    description: 'Microphone distance',
  }],
  [micPos, {
    type: 'enum',
    values: ['CENTER', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    description: 'Microphone position (CENTER or 1-10 cm)',
  }],
  [distType, {
    type: 'enum',
    values: ['VOCAL', 'BOOST', 'OD', 'DS', 'METAL', 'FUZZ'],
    description: 'Distortion algorithm',
  }],
  [noteValue, {
    type: 'enum',
    values: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    description: 'Chromatic note',
  }],
  [keyValue, {
    type: 'enum',
    values: ['C', 'C#', 'D', 'EB', 'E', 'F', 'F#', 'G', 'AB', 'A', 'BB', 'B'],
    description: 'Musical key',
  }],
  [phaserStage, {
    type: 'enum',
    values: ['4', '8', '12', 'BI-PHASE'],
    description: 'Phaser stage count',
  }],
  [algoMode, {
    type: 'enum',
    values: ['1', '2'],
    description: 'Algorithm version (1=legacy, 2=new)',
  }],
  [oscVocOctave, {
    type: 'enum',
    values: ['-2OCT', '-1OCT', '0', '+1OCT'],
    description: 'OSC vocoder octave shift',
  }],
  [twistRelease, {
    type: 'enum',
    values: ['FALL', 'FADE'],
    description: 'Twist release mode',
  }],
  [rollSplit, {
    type: 'enum',
    values: ['OFF', '1/2', '1/4', '1/8', '1/16'],
    description: 'Roll split note division',
  }],
  [octaveMode, {
    type: 'enum',
    values: ['-1OCT', '-2OCT', '-1OCT&-2OCT'],
    description: 'Octave shift mode',
  }],
  [isolatorBand, {
    type: 'enum',
    values: ['LOW', 'MIDDLE', 'HIGH'],
    description: 'Isolator frequency band',
  }],
  [isolatorWave, {
    type: 'enum',
    values: ['TRI', 'SQR'],
    description: 'LFO waveform shape',
  }],
  [oscWaveform, {
    type: 'enum',
    values: ['SAW', 'VINTAGE SAW', 'DETUNE SAW', 'SQUARE', 'RECT'],
    description: 'Oscillator waveform',
  }],
  [vocCarrier, {
    type: 'enum',
    values: ['MIC1', 'MIC2', 'INST1-L', 'INST1-R', 'INST2-L', 'INST2-R', 'TRACK1', 'TRACK2', 'TRACK3', 'TRACK4', 'TRACK5'],
    description: 'Vocoder carrier source',
  }],
  [hrmManualVoice, {
    type: 'enum',
    values: ['OCT-', '-6TH', '-5TH', '-4TH', '-3RD', 'UNISON', '+3RD', '+4TH', '+5TH', '+6TH', 'OCT+'],
    description: 'Manual harmonist interval',
  }],
  [hrmAutoVoice, {
    type: 'enum',
    values: ['OCT-', 'LOWER', 'LOW', 'UNISON', 'HIGH', 'HIGHER', 'OCT+'],
    description: 'Auto harmonist voice range',
  }],
  [hrmAutoMode, {
    type: 'enum',
    values: ['HYBRID', 'AUTO'],
    description: 'Harmonist auto mode',
  }],
  [beatScatterType, {
    type: 'enum',
    values: ['P1', 'P2', 'P3', 'P4'],
    description: 'Beat scatter pattern',
  }],
  [beatRepeatType, {
    type: 'enum',
    values: ['FORWARD', 'REWIND', 'MIX'],
    description: 'Beat repeat direction',
  }],
  [beatShiftType, {
    type: 'enum',
    values: ['FUTURE', 'PAST'],
    description: 'Beat shift direction',
  }],
  [onOff, {
    type: 'enum',
    values: ['OFF', 'ON'],
    description: 'On/off switch',
  }],
  [lofiSampleRate, {
    type: 'enum',
    values: ['OFF', '1/2', '1/3', '1/4', '1/5', '1/6', '1/7', '1/8', '1/9', '1/10', '1/11', '1/12', '1/13', '1/14', '1/15', '1/16', '1/17', '1/18', '1/19', '1/20', '1/21', '1/22', '1/23', '1/24', '1/25', '1/26', '1/27', '1/28', '1/29', '1/30', '1/31', '1/32'],
    description: 'Lo-fi sample rate reduction',
  }],
  [oscBotNote, { type: 'numeric', range: { min: 0, max: 103 }, description: 'OSC BOT note (C1=0 through G9=103, use note+octave format e.g. C2, F#4)' }],
  [pattern20, { type: 'numeric', range: { min: 1, max: 20 }, description: 'Slicer pattern (P01-P20)' }],
  [phrase30, { type: 'numeric', range: { min: 1, max: 30 }, description: 'Auto riff phrase (P1-P30)' }],
  [lofiBitDepth, {
    type: 'numeric',
    range: { min: 0, max: 31 },
    description: 'Bit depth (0=OFF, 1-31 = bit reduction)',
  }],
  [radioLoFi, {
    type: 'numeric',
    range: { min: 1, max: 10 },
    description: 'Lo-fi intensity level',
  }],
  [electricScale, {
    type: 'enum',
    values: ['CHROMATIC', 'C', 'C#', 'D', 'EB', 'E', 'F', 'F#', 'G', 'AB', 'A', 'BB', 'B'],
    description: 'Electric scale (chromatic or key-locked)',
  }],
]);
