import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generatePresetXml } from '../src/generator/rc0-generator.js';
import { parseRC0 } from '../src/parser/rc0-parser.js';
import type { Rack } from '../src/types/rack.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(resolve(__dirname, 'fixtures/default.rc0'), 'utf-8');

/**
 * Full round-trip test: build a Rack with known display values →
 * generate RC0 XML → parse back → verify display values match.
 */
describe('round-trip: generate → parse', () => {
  it('round-trips REVERB params', () => {
    const rack: Rack = {
      id: 'rt-reverb', section: '', title: 'ROUND TRIP', icon: '',
      genres: [], inputType: '', description: '',
      inputFx: [{
        slot: 'A', bank: 'A', effect: 'REVERB',
        params: [
          { name: 'TIME', value: '3.0' },
          { name: 'PRE DELAY', value: '50' },
          { name: 'DENSITY', value: '5' },
          { name: 'LOW CUT', value: 'FLAT' },
          { name: 'HIGH CUT', value: 'FLAT' },
          { name: 'D.LEVEL', value: '80' },
          { name: 'E.LEVEL', value: '60' },
        ],
      }],
      trackFx: [], tips: [],
    };

    const xml = generatePresetXml(template, rack, '0001');
    const config = parseRC0(xml, 1);

    const bankA = config.inputFx.banks.find(b => b.bank === 'A');
    expect(bankA).toBeDefined();
    const reverbSlot = bankA!.slots.find(s => s.effect === 'REVERB');
    expect(reverbSlot).toBeDefined();

    const paramMap = new Map(reverbSlot!.params.map(p => [p.name, p.value]));
    expect(paramMap.get('TIME')).toBe('3.0');
    expect(paramMap.get('PRE DELAY')).toBe('50');
    expect(paramMap.get('DENSITY')).toBe('5');
    expect(paramMap.get('LOW CUT')).toBe('FLAT');
    expect(paramMap.get('HIGH CUT')).toBe('FLAT');
    expect(paramMap.get('D.LEVEL')).toBe('80');
    expect(paramMap.get('E.LEVEL')).toBe('60');
  });

  it('round-trips DYNAMICS params', () => {
    const rack: Rack = {
      id: 'rt-dynamics', section: '', title: 'DYN RT', icon: '',
      genres: [], inputType: '', description: '',
      inputFx: [{
        slot: 'A', bank: 'A', effect: 'DYNAMICS',
        params: [
          { name: 'TYPE', value: 'HARD LIM' },
          { name: 'DYNAMICS', value: '-6' },
        ],
      }],
      trackFx: [], tips: [],
    };

    const xml = generatePresetXml(template, rack, '0001');
    const config = parseRC0(xml, 1);

    const slot = config.inputFx.banks[0]?.slots.find(s => s.effect === 'DYNAMICS');
    expect(slot).toBeDefined();

    const paramMap = new Map(slot!.params.map(p => [p.name, p.value]));
    expect(paramMap.get('TYPE')).toBe('HARD LIM');
    expect(paramMap.get('DYNAMICS')).toBe('-6');
  });

  it('round-trips DELAY with note value TIME', () => {
    const rack: Rack = {
      id: 'rt-delay', section: '', title: 'DELAY RT', icon: '',
      genres: [], inputType: '', description: '',
      inputFx: [{
        slot: 'A', bank: 'A', effect: 'DELAY',
        params: [
          { name: 'TIME', value: '1/4' },
          { name: 'FEEDBACK', value: '4' },
          { name: 'D.LEVEL', value: '50' },
          { name: 'LOW CUT', value: '100 HZ' },
          { name: 'HIGH CUT', value: '8.00K HZ' },
          { name: 'E.LEVEL', value: '80' },
        ],
      }],
      trackFx: [], tips: [],
    };

    const xml = generatePresetXml(template, rack, '0001');
    const config = parseRC0(xml, 1);

    const slot = config.inputFx.banks[0]?.slots.find(s => s.effect === 'DELAY');
    expect(slot).toBeDefined();

    const paramMap = new Map(slot!.params.map(p => [p.name, p.value]));
    expect(paramMap.get('TIME')).toBe('1/4');
    expect(paramMap.get('FEEDBACK')).toBe('4');
    expect(paramMap.get('LOW CUT')).toBe('100 Hz');
    expect(paramMap.get('HIGH CUT')).toBe('8.00 kHz');
  });

  it('round-trips TRANSPOSE params', () => {
    const rack: Rack = {
      id: 'rt-transpose', section: '', title: 'TRANS RT', icon: '',
      genres: [], inputType: '', description: '',
      inputFx: [{
        slot: 'A', bank: 'A', effect: 'TRANSPOSE',
        params: [
          { name: 'TRANS', value: '-5' },
          { name: 'MODE', value: '2' },
        ],
      }],
      trackFx: [], tips: [],
    };

    const xml = generatePresetXml(template, rack, '0001');
    const config = parseRC0(xml, 1);

    const slot = config.inputFx.banks[0]?.slots.find(s => s.effect === 'TRANSPOSE');
    expect(slot).toBeDefined();

    const paramMap = new Map(slot!.params.map(p => [p.name, p.value]));
    expect(paramMap.get('TRANS')).toBe('-5');
    expect(paramMap.get('MODE')).toBe('2');
  });

  it('round-trips LOFI params', () => {
    const rack: Rack = {
      id: 'rt-lofi', section: '', title: 'LOFI RT', icon: '',
      genres: [], inputType: '', description: '',
      inputFx: [{
        slot: 'A', bank: 'A', effect: 'LOFI',
        params: [
          { name: 'BITDEPTH', value: '16' },
          { name: 'SAMPLERATE', value: '1/4' },
          { name: 'BALANCE', value: '50' },
        ],
      }],
      trackFx: [], tips: [],
    };

    const xml = generatePresetXml(template, rack, '0001');
    const config = parseRC0(xml, 1);

    const slot = config.inputFx.banks[0]?.slots.find(s => s.effect === 'LOFI');
    expect(slot).toBeDefined();

    const paramMap = new Map(slot!.params.map(p => [p.name, p.value]));
    expect(paramMap.get('BITDEPTH')).toBe('16');
    expect(paramMap.get('SAMPLERATE')).toBe('1/4');
    expect(paramMap.get('BALANCE')).toBe('50');
  });

  it('round-trips EQ params', () => {
    const rack: Rack = {
      id: 'rt-eq', section: '', title: 'EQ RT', icon: '',
      genres: [], inputType: '', description: '',
      inputFx: [{
        slot: 'A', bank: 'A', effect: 'EQ',
        params: [
          { name: 'LO GAIN', value: '-5' },
          { name: 'LO-MID GAIN', value: '3' },
          { name: 'HI-MID GAIN', value: '0' },
          { name: 'HI GAIN', value: '10' },
          { name: 'LEVEL', value: '-2' },
          { name: 'LO-MID FREQ', value: '500 HZ' },
          { name: 'LO-MID Q', value: '4' },
          { name: 'HI-MID FREQ', value: '2.00K HZ' },
          { name: 'HI-MID Q', value: '2' },
        ],
      }],
      trackFx: [], tips: [],
    };

    const xml = generatePresetXml(template, rack, '0001');
    const config = parseRC0(xml, 1);

    const slot = config.inputFx.banks[0]?.slots.find(s => s.effect === 'EQ');
    expect(slot).toBeDefined();

    const paramMap = new Map(slot!.params.map(p => [p.name, p.value]));
    expect(paramMap.get('LO GAIN')).toBe('-5');
    expect(paramMap.get('LO-MID GAIN')).toBe('3');
    expect(paramMap.get('HI-MID GAIN')).toBe('0');
    expect(paramMap.get('HI GAIN')).toBe('10');
    expect(paramMap.get('LEVEL')).toBe('-2');
    expect(paramMap.get('LO-MID FREQ')).toBe('500 Hz');
    expect(paramMap.get('LO-MID Q')).toBe('4');
    expect(paramMap.get('HI-MID FREQ')).toBe('2.00 kHz');
    expect(paramMap.get('HI-MID Q')).toBe('2');
  });

  it('round-trips PREAMP params', () => {
    const rack: Rack = {
      id: 'rt-preamp', section: '', title: 'PREAMP RT', icon: '',
      genres: [], inputType: '', description: '',
      inputFx: [{
        slot: 'A', bank: 'A', effect: 'PREAMP',
        params: [
          { name: 'AMP TYPE', value: 'COMBO CRUNCH' },
          { name: 'SPK TYPE', value: '4X12"' },
          { name: 'GAIN', value: '80' },
          { name: 'T-COMP', value: '-3' },
          { name: 'MIC TYPE', value: 'CND 87' },
          { name: 'MIC DIS', value: 'ON MIC' },
          { name: 'MIC POS', value: 'CENTER' },
        ],
      }],
      trackFx: [], tips: [],
    };

    const xml = generatePresetXml(template, rack, '0001');
    const config = parseRC0(xml, 1);

    const slot = config.inputFx.banks[0]?.slots.find(s => s.effect === 'PREAMP');
    expect(slot).toBeDefined();

    const paramMap = new Map(slot!.params.map(p => [p.name, p.value]));
    expect(paramMap.get('AMP TYPE')).toBe('COMBO CRUNCH');
    expect(paramMap.get('SPK TYPE')).toBe('4X12"');
    expect(paramMap.get('GAIN')).toBe('80');
    expect(paramMap.get('T-COMP')).toBe('-3');
    expect(paramMap.get('MIC TYPE')).toBe('CND 87');
    expect(paramMap.get('MIC DIS')).toBe('ON MIC');
    expect(paramMap.get('MIC POS')).toBe('CENTER');
  });

  it('round-trips multiple FX in same bank', () => {
    const rack: Rack = {
      id: 'rt-multi', section: '', title: 'MULTI RT', icon: '',
      genres: [], inputType: '', description: '',
      inputFx: [
        {
          slot: 'A', bank: 'A', effect: 'DYNAMICS',
          params: [
            { name: 'TYPE', value: 'NATURAL COMP' },
            { name: 'DYNAMICS', value: '0' },
          ],
        },
        {
          slot: 'B', bank: 'A', effect: 'REVERB',
          params: [
            { name: 'TIME', value: '5.0' },
            { name: 'DENSITY', value: '8' },
          ],
        },
      ],
      trackFx: [], tips: [],
    };

    const xml = generatePresetXml(template, rack, '0001');
    const config = parseRC0(xml, 1);

    const bankA = config.inputFx.banks.find(b => b.bank === 'A');
    expect(bankA).toBeDefined();
    expect(bankA!.slots.length).toBe(2);

    const dynSlot = bankA!.slots.find(s => s.effect === 'DYNAMICS');
    const dynParams = new Map(dynSlot!.params.map(p => [p.name, p.value]));
    expect(dynParams.get('TYPE')).toBe('NATURAL COMP');
    expect(dynParams.get('DYNAMICS')).toBe('0');

    const revSlot = bankA!.slots.find(s => s.effect === 'REVERB');
    const revParams = new Map(revSlot!.params.map(p => [p.name, p.value]));
    expect(revParams.get('TIME')).toBe('5.0');
    expect(revParams.get('DENSITY')).toBe('8');
  });
});
