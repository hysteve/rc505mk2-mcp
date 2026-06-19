import { describe, it, expect } from 'vitest';
import {
  num, eqGain, dynamicsType, reverbType, preampType, spkType, micType,
  micDis, distType, noteValue, keyValue, phaserStage, algoMode,
  twistRelease, rollSplit, octaveMode, isolatorBand, isolatorWave,
  oscWaveform, vocCarrier, hrmManualVoice, hrmAutoVoice, hrmAutoMode,
  beatScatterType, beatRepeatType, beatShiftType, onOff, lofiBitDepth,
  radioLoFi, electricScale, seqMax,
} from '../src/params/transforms.js';

describe('num', () => {
  it('parses numeric strings', () => {
    expect(num('42')).toBe(42);
    expect(num('3.7')).toBe(4);
    expect(num('0')).toBe(0);
  });

  it('returns 0 for non-numeric', () => {
    expect(num('abc')).toBe(0);
    expect(num('')).toBe(0);
  });
});

describe('eqGain', () => {
  it('maps -20..+20 dB to 0..40', () => {
    expect(eqGain('-20')).toBe(0);
    expect(eqGain('0')).toBe(20);
    expect(eqGain('20')).toBe(40);
    expect(eqGain('-5')).toBe(15);
  });
});

describe('dynamicsType', () => {
  it('maps named types', () => {
    expect(dynamicsType('NATURAL COMP')).toBe(0);
    expect(dynamicsType('MIXER COMP')).toBe(1);
    expect(dynamicsType('HARD LIM')).toBe(4);
    expect(dynamicsType('BRIGHTEN')).toBe(16);
  });

  it('falls back to num for unknown', () => {
    expect(dynamicsType('5')).toBe(5);
  });
});

describe('reverbType', () => {
  it('maps reverb algorithms', () => {
    expect(reverbType('AMBIENCE')).toBe(0);
    expect(reverbType('HALL1')).toBe(2);
    expect(reverbType('PLATE')).toBe(4);
    expect(reverbType('MODULATE')).toBe(6);
  });
});

describe('preampType', () => {
  it('maps amp models', () => {
    expect(preampType('JC-120')).toBe(0);
    expect(preampType('COMBO CRUNCH')).toBe(3);
    expect(preampType('CORE METAL')).toBe(8);
  });

  it('handles legacy aliases', () => {
    expect(preampType('METAL')).toBe(8);
    expect(preampType('JC CLEAN')).toBe(0);
  });
});

describe('spkType', () => {
  it('maps speaker cabinets', () => {
    expect(spkType('OFF')).toBe(0);
    expect(spkType('ORIGINAL')).toBe(1);
    expect(spkType('4X12')).toBe(7);
  });
});

describe('micType', () => {
  it('maps mic types', () => {
    expect(micType('DYN 57')).toBe(0);
    expect(micType('FLAT')).toBe(4);
  });
});

describe('micDis', () => {
  it('maps mic distance', () => {
    expect(micDis('OFF MIC')).toBe(0);
    expect(micDis('ON MIC')).toBe(1);
  });
});

describe('distType', () => {
  it('maps distortion types', () => {
    expect(distType('VOCAL')).toBe(0);
    expect(distType('OD')).toBe(2);
    expect(distType('FUZZ')).toBe(5);
  });
});

describe('noteValue', () => {
  it('maps chromatic notes', () => {
    expect(noteValue('C')).toBe(0);
    expect(noteValue('C#')).toBe(1);
    expect(noteValue('E')).toBe(4);
    expect(noteValue('B')).toBe(11);
  });

  it('handles enharmonic equivalents', () => {
    expect(noteValue('Db')).toBe(1);
    expect(noteValue('Eb')).toBe(3);
  });
});

describe('keyValue', () => {
  it('maps keys with relative minor', () => {
    expect(keyValue('C')).toBe(0);
    expect(keyValue('C (Am)')).toBe(0);
    expect(keyValue('G (Em)')).toBe(7);
  });
});

describe('phaserStage', () => {
  it('maps stage counts', () => {
    expect(phaserStage('4')).toBe(0);
    expect(phaserStage('8')).toBe(1);
    expect(phaserStage('12')).toBe(2);
    expect(phaserStage('BI-PHASE')).toBe(3);
  });
});

describe('algoMode', () => {
  it('maps algorithm modes', () => {
    expect(algoMode('1')).toBe(0);
    expect(algoMode('2')).toBe(1);
  });
});

describe('twistRelease', () => {
  it('maps release types', () => {
    expect(twistRelease('FALL')).toBe(0);
    expect(twistRelease('FADE')).toBe(1);
  });
});

describe('rollSplit', () => {
  it('maps split values', () => {
    expect(rollSplit('OFF')).toBe(0);
    expect(rollSplit('1/2')).toBe(1);
    expect(rollSplit('1/16')).toBe(4);
  });
});

describe('octaveMode', () => {
  it('maps octave modes', () => {
    expect(octaveMode('-1OCT')).toBe(0);
    expect(octaveMode('-2OCT')).toBe(1);
    expect(octaveMode('-1OCT&-2OCT')).toBe(2);
  });
});

describe('isolatorBand', () => {
  it('maps bands', () => {
    expect(isolatorBand('LOW')).toBe(0);
    expect(isolatorBand('MIDDLE')).toBe(1);
    expect(isolatorBand('HIGH')).toBe(2);
  });
});

describe('isolatorWave', () => {
  it('maps waveforms', () => {
    expect(isolatorWave('TRI')).toBe(0);
    expect(isolatorWave('SQR')).toBe(1);
  });
});

describe('oscWaveform', () => {
  it('maps oscillator waveforms', () => {
    expect(oscWaveform('SAW')).toBe(0);
    expect(oscWaveform('VINTAGE SAW')).toBe(1);
    expect(oscWaveform('SQUARE')).toBe(3);
  });
});

describe('vocCarrier', () => {
  it('maps carrier sources', () => {
    expect(vocCarrier('MIC1')).toBe(0);
    expect(vocCarrier('TRACK1')).toBe(6);
    expect(vocCarrier('TRACK5')).toBe(10);
  });
});

describe('hrmManualVoice', () => {
  it('maps voice types', () => {
    expect(hrmManualVoice('OCT-')).toBe(0);
    expect(hrmManualVoice('UNISON')).toBe(5);
    expect(hrmManualVoice('OCT+')).toBe(10);
  });
});

describe('hrmAutoVoice', () => {
  it('maps auto voice types', () => {
    expect(hrmAutoVoice('OCT-')).toBe(0);
    expect(hrmAutoVoice('UNISON')).toBe(3);
    expect(hrmAutoVoice('OCT+')).toBe(6);
  });
});

describe('hrmAutoMode', () => {
  it('maps harmonist modes', () => {
    expect(hrmAutoMode('HYBRID')).toBe(0);
    expect(hrmAutoMode('AUTO')).toBe(1);
  });
});

describe('beatScatterType', () => {
  it('maps scatter patterns', () => {
    expect(beatScatterType('P1')).toBe(0);
    expect(beatScatterType('P4')).toBe(3);
  });
});

describe('beatRepeatType', () => {
  it('maps repeat types', () => {
    expect(beatRepeatType('FORWARD')).toBe(0);
    expect(beatRepeatType('REWIND')).toBe(1);
    expect(beatRepeatType('MIX')).toBe(2);
  });
});

describe('beatShiftType', () => {
  it('maps shift types', () => {
    expect(beatShiftType('FUTURE')).toBe(0);
    expect(beatShiftType('PAST')).toBe(1);
  });
});

describe('onOff', () => {
  it('maps OFF/ON', () => {
    expect(onOff('OFF')).toBe(0);
    expect(onOff('ON')).toBe(1);
  });

  it('clamps numeric values', () => {
    expect(onOff('0')).toBe(0);
    expect(onOff('1')).toBe(1);
  });
});

describe('lofiBitDepth', () => {
  it('maps OFF to 0', () => {
    expect(lofiBitDepth('OFF')).toBe(0);
  });

  it('inverts bit depth range (31→1, 1→31)', () => {
    expect(lofiBitDepth('31')).toBe(1);
    expect(lofiBitDepth('1')).toBe(31);
    expect(lofiBitDepth('16')).toBe(16);
  });
});

describe('radioLoFi', () => {
  it('maps display 1-10 to stored 0-9', () => {
    expect(radioLoFi('1')).toBe(0);
    expect(radioLoFi('5')).toBe(4);
    expect(radioLoFi('10')).toBe(9);
  });
});

describe('electricScale', () => {
  it('maps CHROMATIC to 0', () => {
    expect(electricScale('CHROMATIC')).toBe(0);
  });

  it('maps keys offset by 1', () => {
    expect(electricScale('C')).toBe(1);
    expect(electricScale('G')).toBe(8);
  });
});

describe('seqMax', () => {
  it('maps 1-16 to 0-15', () => {
    expect(seqMax('1')).toBe(0);
    expect(seqMax('16')).toBe(15);
    expect(seqMax('8')).toBe(7);
  });
});
