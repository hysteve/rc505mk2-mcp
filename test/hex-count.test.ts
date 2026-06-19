import { describe, it, expect } from 'vitest';
import { parseHexCount, formatHexCount, extractCount } from '../src/parser/hex-count.js';

describe('parseHexCount', () => {
  it('parses hex strings to numbers', () => {
    expect(parseHexCount('0000')).toBe(0);
    expect(parseHexCount('0001')).toBe(1);
    expect(parseHexCount('000A')).toBe(10);
    expect(parseHexCount('00FF')).toBe(255);
    expect(parseHexCount('FFFF')).toBe(65535);
  });
});

describe('formatHexCount', () => {
  it('formats numbers as 4-digit hex strings', () => {
    expect(formatHexCount(0)).toBe('0000');
    expect(formatHexCount(1)).toBe('0001');
    expect(formatHexCount(10)).toBe('000A');
    expect(formatHexCount(255)).toBe('00FF');
    expect(formatHexCount(65535)).toBe('FFFF');
  });

  it('roundtrips with parseHexCount', () => {
    for (const n of [0, 1, 42, 256, 1000, 65535]) {
      expect(parseHexCount(formatHexCount(n))).toBe(n);
    }
  });
});

describe('extractCount', () => {
  it('extracts count from RC0 XML', () => {
    expect(extractCount('<count>0042</count><root>...</root>')).toBe('0042');
  });

  it('returns 0000 when no count tag exists', () => {
    expect(extractCount('<root>no count here</root>')).toBe('0000');
  });
});
