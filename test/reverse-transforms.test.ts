import { describe, it, expect } from 'vitest';
import {
  reverseNum, reverseEqGain, reverseCentered50, reverseCentered10,
  reverseTransposeSemi, reversePitchBendOct, reverseCompThreshold,
  reverseDensity, reverseDuty, reverseRadioLoFi, reverseSeqMax,
  reverseReverbTime, reverseGateTime, reverseInitPhase,
  reverseDelayTime, reverseRollTime,
  reverseLowCut, reverseHighCut, reverseEqFreq, reverseEqQ,
  reverseDynamicsType, reverseReverbType, reversePreampType, reverseSpkType,
  reverseMicType, reverseMicDis, reverseDistType, reverseNoteValue,
  reverseKeyValue, reversePhaserStage, reverseAlgoMode, reverseOnOff,
  reverseOscVocOctave, reverseTwistRelease, reverseRollSplit,
  reverseOctaveMode, reverseIsolatorBand, reverseIsolatorWave,
  reverseOscWaveform, reverseVocCarrier, reverseHrmManualVoice,
  reverseHrmAutoVoice, reverseHrmAutoMode,
  reverseBeatScatterType, reverseBeatRepeatType, reverseBeatShiftType,
  reverseLofiBitDepth, reverseLofiSampleRate, reverseOscBotNote,
  reversePattern20, reversePhrase30, reverseMicPos, reverseElectricScale,
} from '../src/params/reverse-transforms.js';

// ── Centered/offset transforms ─────────────────────────────────────

describe('reverseEqGain', () => {
  it('reverses eqGain: RC0 0..40 → -20..+20', () => {
    expect(reverseEqGain(0)).toBe('-20');
    expect(reverseEqGain(20)).toBe('0');
    expect(reverseEqGain(40)).toBe('20');
    expect(reverseEqGain(15)).toBe('-5');
  });
});

describe('reverseCentered50', () => {
  it('reverses centered50: RC0 0..100 → -50..+50', () => {
    expect(reverseCentered50(0)).toBe('-50');
    expect(reverseCentered50(50)).toBe('0');
    expect(reverseCentered50(100)).toBe('50');
  });
});

describe('reverseCentered10', () => {
  it('reverses centered10: RC0 0..20 → -10..+10', () => {
    expect(reverseCentered10(0)).toBe('-10');
    expect(reverseCentered10(10)).toBe('0');
    expect(reverseCentered10(20)).toBe('10');
  });
});

describe('reverseTransposeSemi', () => {
  it('reverses transposeSemi: RC0 0..24 → -12..+12', () => {
    expect(reverseTransposeSemi(0)).toBe('-12');
    expect(reverseTransposeSemi(12)).toBe('0');
    expect(reverseTransposeSemi(24)).toBe('12');
  });
});

describe('reversePitchBendOct', () => {
  it('reverses pitchBendOct: RC0 0..7 → -3..+4', () => {
    expect(reversePitchBendOct(0)).toBe('-3');
    expect(reversePitchBendOct(3)).toBe('0');
    expect(reversePitchBendOct(7)).toBe('4');
  });
});

describe('reverseCompThreshold', () => {
  it('reverses compThreshold: RC0 0..30 → -30..0', () => {
    expect(reverseCompThreshold(0)).toBe('-30');
    expect(reverseCompThreshold(30)).toBe('0');
    expect(reverseCompThreshold(15)).toBe('-15');
  });
});

// ── Offset-by-one transforms ───────────────────────────────────────

describe('reverseDensity', () => {
  it('reverses density: RC0 0..9 → 1..10', () => {
    expect(reverseDensity(0)).toBe('1');
    expect(reverseDensity(9)).toBe('10');
    expect(reverseDensity(4)).toBe('5');
  });
});

describe('reverseDuty', () => {
  it('reverses duty: RC0 0..98 → 1..99', () => {
    expect(reverseDuty(0)).toBe('1');
    expect(reverseDuty(49)).toBe('50');
    expect(reverseDuty(98)).toBe('99');
  });
});

describe('reverseRadioLoFi', () => {
  it('reverses radioLoFi: RC0 0..9 → 1..10', () => {
    expect(reverseRadioLoFi(0)).toBe('1');
    expect(reverseRadioLoFi(9)).toBe('10');
  });
});

describe('reverseSeqMax', () => {
  it('reverses seqMax: RC0 0..15 → 1..16', () => {
    expect(reverseSeqMax(0)).toBe('1');
    expect(reverseSeqMax(15)).toBe('16');
    expect(reverseSeqMax(7)).toBe('8');
  });
});

// ── Scaled transforms ──────────────────────────────────────────────

describe('reverseReverbTime', () => {
  it('reverses reverbTime: RC0 1..100 → 0.1..10.0', () => {
    expect(reverseReverbTime(1)).toBe('0.1');
    expect(reverseReverbTime(30)).toBe('3.0');
    expect(reverseReverbTime(100)).toBe('10.0');
  });
});

describe('reverseGateTime', () => {
  it('reverses gateTime: RC0 1..10 → 0.1..1.0', () => {
    expect(reverseGateTime(1)).toBe('0.1');
    expect(reverseGateTime(5)).toBe('0.5');
    expect(reverseGateTime(10)).toBe('1.0');
  });
});

describe('reverseInitPhase', () => {
  it('reverses initPhase: RC0 0..12 → 0..180', () => {
    expect(reverseInitPhase(0)).toBe('0');
    expect(reverseInitPhase(6)).toBe('90');
    expect(reverseInitPhase(12)).toBe('180');
  });
});

// ── Time-based transforms ──────────────────────────────────────────

describe('reverseDelayTime', () => {
  it('reverses note values (RC0 0-10)', () => {
    expect(reverseDelayTime(0)).toBe('1/32');
    expect(reverseDelayTime(4)).toBe('1/8');
    expect(reverseDelayTime(7)).toBe('1/4');
    expect(reverseDelayTime(10)).toBe('1/2');
  });

  it('reverses ms values (RC0 11+)', () => {
    expect(reverseDelayTime(11)).toBe('1');
    expect(reverseDelayTime(211)).toBe('201');
    expect(reverseDelayTime(2010)).toBe('2000');
  });
});

describe('reverseRollTime', () => {
  it('reverses note values', () => {
    expect(reverseRollTime(0)).toBe('1/32');
    expect(reverseRollTime(7)).toBe('1/4');
  });

  it('reverses ms values', () => {
    expect(reverseRollTime(11)).toBe('1');
    expect(reverseRollTime(1010)).toBe('1000');
  });
});

// ── Frequency transforms ───────────────────────────────────────────

describe('reverseLowCut', () => {
  it('reverses lowCut: 0=FLAT, 1-29=frequencies', () => {
    expect(reverseLowCut(0)).toBe('FLAT');
    expect(reverseLowCut(1)).toBe('20.0 Hz');
    expect(reverseLowCut(29)).toBe('12.5 kHz');
  });
});

describe('reverseHighCut', () => {
  it('reverses highCut: 29=FLAT, 0-28=frequencies', () => {
    expect(reverseHighCut(29)).toBe('FLAT');
    expect(reverseHighCut(0)).toBe('20.0 Hz');
    expect(reverseHighCut(28)).toBe('12.5 kHz');
  });
});

describe('reverseEqFreq', () => {
  it('reverses eqFreq: 0-28=frequencies', () => {
    expect(reverseEqFreq(0)).toBe('20.0 Hz');
    expect(reverseEqFreq(17)).toBe('1.00 kHz');
  });
});

describe('reverseEqQ', () => {
  it('reverses eqQ: 0-5 → Q values', () => {
    expect(reverseEqQ(0)).toBe('0.5');
    expect(reverseEqQ(1)).toBe('1');
    expect(reverseEqQ(5)).toBe('16');
  });
});

// ── Enum transforms ────────────────────────────────────────────────

describe('reverseDynamicsType', () => {
  it('reverses dynamics type enums', () => {
    expect(reverseDynamicsType(0)).toBe('NATURAL COMP');
    expect(reverseDynamicsType(4)).toBe('HARD LIM');
    expect(reverseDynamicsType(16)).toBe('BRIGHTEN');
    expect(reverseDynamicsType(18)).toBe('PHONE VOX');
  });
});

describe('reverseReverbType', () => {
  it('reverses reverb type enums', () => {
    expect(reverseReverbType(0)).toBe('AMBIENCE');
    expect(reverseReverbType(2)).toBe('HALL1');
    expect(reverseReverbType(6)).toBe('MODULATE');
  });
});

describe('reversePreampType', () => {
  it('reverses preamp type enums', () => {
    expect(reversePreampType(0)).toBe('JC-120');
    expect(reversePreampType(3)).toBe('COMBO CRUNCH');
    expect(reversePreampType(8)).toBe('CORE METAL');
  });
});

describe('reverseSpkType', () => {
  it('reverses speaker type enums', () => {
    expect(reverseSpkType(0)).toBe('OFF');
    expect(reverseSpkType(1)).toBe('ORIGINAL');
    expect(reverseSpkType(7)).toBe('4X12"');
  });
});

describe('reverseMicType', () => {
  it('reverses mic type enums', () => {
    expect(reverseMicType(0)).toBe('DYN ST');
    expect(reverseMicType(4)).toBe('FLAT');
  });
});

describe('reverseDistType', () => {
  it('reverses distortion type enums', () => {
    expect(reverseDistType(0)).toBe('VOCAL');
    expect(reverseDistType(2)).toBe('OD');
    expect(reverseDistType(5)).toBe('FUZZ');
  });
});

describe('reverseNoteValue', () => {
  it('reverses note values', () => {
    expect(reverseNoteValue(0)).toBe('C');
    expect(reverseNoteValue(1)).toBe('C#');
    expect(reverseNoteValue(11)).toBe('B');
  });
});

describe('reverseKeyValue', () => {
  it('reverses key values (canonical form)', () => {
    expect(reverseKeyValue(0)).toBe('C');
    expect(reverseKeyValue(3)).toBe('EB');
    expect(reverseKeyValue(7)).toBe('G');
  });
});

describe('reverseOnOff', () => {
  it('reverses on/off', () => {
    expect(reverseOnOff(0)).toBe('OFF');
    expect(reverseOnOff(1)).toBe('ON');
  });
});

describe('reverseOscWaveform', () => {
  it('reverses oscillator waveforms', () => {
    expect(reverseOscWaveform(0)).toBe('SAW');
    expect(reverseOscWaveform(1)).toBe('VINTAGE SAW');
    expect(reverseOscWaveform(3)).toBe('SQUARE');
  });
});

describe('reverseVocCarrier', () => {
  it('reverses vocoder carrier sources', () => {
    expect(reverseVocCarrier(0)).toBe('MIC1');
    expect(reverseVocCarrier(6)).toBe('TRACK1');
    expect(reverseVocCarrier(10)).toBe('TRACK5');
  });
});

describe('reverseHrmManualVoice', () => {
  it('reverses manual harmonist voices', () => {
    expect(reverseHrmManualVoice(0)).toBe('OCT-');
    expect(reverseHrmManualVoice(5)).toBe('UNISON');
    expect(reverseHrmManualVoice(10)).toBe('OCT+');
  });
});

describe('reverseHrmAutoVoice', () => {
  it('reverses auto harmonist voices', () => {
    expect(reverseHrmAutoVoice(0)).toBe('OCT-');
    expect(reverseHrmAutoVoice(3)).toBe('UNISON');
    expect(reverseHrmAutoVoice(6)).toBe('OCT+');
  });
});

// ── Special transforms ─────────────────────────────────────────────

describe('reverseLofiBitDepth', () => {
  it('reverses lofi bit depth', () => {
    expect(reverseLofiBitDepth(0)).toBe('OFF');
    expect(reverseLofiBitDepth(1)).toBe('31');
    expect(reverseLofiBitDepth(31)).toBe('1');
    expect(reverseLofiBitDepth(16)).toBe('16');
  });
});

describe('reverseLofiSampleRate', () => {
  it('reverses lofi sample rate', () => {
    expect(reverseLofiSampleRate(0)).toBe('OFF');
    expect(reverseLofiSampleRate(1)).toBe('1/2');
    expect(reverseLofiSampleRate(31)).toBe('1/32');
  });
});

describe('reverseOscBotNote', () => {
  it('reverses OSC BOT note (RC0 → note+octave)', () => {
    expect(reverseOscBotNote(0)).toBe('C1');
    expect(reverseOscBotNote(12)).toBe('C2');
    expect(reverseOscBotNote(1)).toBe('C#1');
    expect(reverseOscBotNote(103)).toBe('G9');
  });
});

describe('reversePattern20', () => {
  it('reverses pattern20: RC0 0..19 → P01..P20', () => {
    expect(reversePattern20(0)).toBe('P01');
    expect(reversePattern20(19)).toBe('P20');
  });
});

describe('reversePhrase30', () => {
  it('reverses phrase30: RC0 0..29 → P1..P30', () => {
    expect(reversePhrase30(0)).toBe('P1');
    expect(reversePhrase30(29)).toBe('P30');
  });
});

describe('reverseMicPos', () => {
  it('reverses mic position', () => {
    expect(reverseMicPos(0)).toBe('CENTER');
    expect(reverseMicPos(5)).toBe('5');
    expect(reverseMicPos(10)).toBe('10');
  });
});

describe('reverseElectricScale', () => {
  it('reverses electric scale', () => {
    expect(reverseElectricScale(0)).toBe('CHROMATIC');
    expect(reverseElectricScale(1)).toBe('C');
    expect(reverseElectricScale(8)).toBe('G');
  });
});

// ── Round-trip verification ────────────────────────────────────────

import {
  eqGain, centered50, centered10, transposeSemi, pitchBendOct,
  compThreshold, density, duty, radioLoFi, seqMax,
  reverbTime, gateTime, initPhase, delayTime, rollTime,
  lowCut, highCut, eqFreq, eqQ,
  dynamicsType, reverbType, preampType, distType, noteValue,
  keyValue, phaserStage, algoMode, onOff, lofiBitDepth,
  lofiSampleRate, oscBotNote, pattern20, phrase30, micPos,
  electricScale, oscWaveform, vocCarrier, hrmManualVoice,
} from '../src/params/transforms.js';

describe('round-trip: forward → reverse', () => {
  const cases: [string, (v: string) => number, (rc0: number) => string, string[]][] = [
    ['eqGain', eqGain, reverseEqGain, ['-20', '-5', '0', '5', '20']],
    ['centered50', centered50, reverseCentered50, ['-50', '-10', '0', '10', '50']],
    ['centered10', centered10, reverseCentered10, ['-10', '0', '10']],
    ['transposeSemi', transposeSemi, reverseTransposeSemi, ['-12', '-5', '0', '7', '12']],
    ['pitchBendOct', pitchBendOct, reversePitchBendOct, ['-3', '0', '4']],
    ['compThreshold', compThreshold, reverseCompThreshold, ['-30', '-15', '0']],
    ['density', density, reverseDensity, ['1', '5', '10']],
    ['duty', duty, reverseDuty, ['1', '50', '99']],
    ['radioLoFi', radioLoFi, reverseRadioLoFi, ['1', '5', '10']],
    ['seqMax', seqMax, reverseSeqMax, ['1', '8', '16']],
    ['reverbTime', reverbTime, reverseReverbTime, ['0.1', '3.0', '10.0']],
    ['gateTime', gateTime, reverseGateTime, ['0.1', '0.5', '1.0']],
    ['initPhase', initPhase, reverseInitPhase, ['0', '90', '180']],
    ['delayTime (notes)', delayTime, reverseDelayTime, ['1/32', '1/8', '1/4', '1/2']],
    ['rollTime (notes)', rollTime, reverseRollTime, ['1/32', '1/8', '1/4']],
    ['lowCut', lowCut, reverseLowCut, ['FLAT', '20.0 Hz', '100 Hz', '12.5 kHz']],
    ['highCut', highCut, reverseHighCut, ['FLAT', '20.0 Hz', '1.00 kHz']],
    ['eqFreq', eqFreq, reverseEqFreq, ['20.0 Hz', '500 Hz', '10.0 kHz']],
    ['eqQ', eqQ, reverseEqQ, ['0.5', '1', '4', '16']],
    ['dynamicsType', dynamicsType, reverseDynamicsType, ['NATURAL COMP', 'HARD LIM', 'BRIGHTEN']],
    ['reverbType', reverbType, reverseReverbType, ['AMBIENCE', 'HALL1', 'MODULATE']],
    ['preampType', preampType, reversePreampType, ['JC-120', 'COMBO CRUNCH', 'CORE METAL']],
    ['distType', distType, reverseDistType, ['VOCAL', 'OD', 'FUZZ']],
    ['noteValue', noteValue, reverseNoteValue, ['C', 'C#', 'E', 'B']],
    ['keyValue', keyValue, reverseKeyValue, ['C', 'EB', 'G']],
    ['phaserStage', phaserStage, reversePhaserStage, ['4', '8', '12', 'BI-PHASE']],
    ['algoMode', algoMode, reverseAlgoMode, ['1', '2']],
    ['onOff', onOff, reverseOnOff, ['OFF', 'ON']],
    ['lofiBitDepth', lofiBitDepth, reverseLofiBitDepth, ['OFF', '1', '16', '31']],
    ['lofiSampleRate', lofiSampleRate, reverseLofiSampleRate, ['OFF', '1/2', '1/16', '1/32']],
    ['oscBotNote', oscBotNote, reverseOscBotNote, ['C1', 'C#1', 'C2', 'G9']],
    ['pattern20', pattern20, reversePattern20, ['P01', 'P10', 'P20']],
    ['phrase30', phrase30, reversePhrase30, ['P1', 'P15', 'P30']],
    ['micPos', micPos, reverseMicPos, ['CENTER', '1', '10']],
    ['electricScale', electricScale, reverseElectricScale, ['CHROMATIC', 'C', 'G']],
    ['oscWaveform', oscWaveform, reverseOscWaveform, ['SAW', 'VINTAGE SAW', 'SQUARE']],
    ['vocCarrier', vocCarrier, reverseVocCarrier, ['MIC1', 'TRACK1', 'TRACK5']],
    ['hrmManualVoice', hrmManualVoice, reverseHrmManualVoice, ['OCT-', 'UNISON', 'OCT+']],
  ];

  for (const [name, forward, reverse, values] of cases) {
    it(`${name}: display → RC0 → display round-trips`, () => {
      for (const displayVal of values) {
        const rc0 = forward(displayVal);
        const roundTripped = reverse(rc0);
        expect(roundTripped).toBe(displayVal);
      }
    });
  }
});

// ── Round-trip: delayTime ms values ────────────────────────────────

describe('round-trip: delayTime ms values', () => {
  it('round-trips ms values', () => {
    for (const ms of ['1', '100', '500', '2000']) {
      const rc0 = delayTime(ms);
      const back = reverseDelayTime(rc0);
      expect(back).toBe(ms);
    }
  });
});
