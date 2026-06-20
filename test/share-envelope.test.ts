import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRC0PairActive } from '../src/parser/rc0-parser.js';
import { memoryConfigToRc0Pair } from '../src/generator/rc0-generator.js';
import {
  parseShareEnvelopeJson,
  ShareEnvelopeSchema,
} from '../src/share/envelope.js';
import {
  extractRackFromMemory,
  extractFxModuleFromMemory,
  memoryConfigToShare,
} from '../src/share/extract.js';
import {
  handleExportShare,
  handleImportShare,
} from '../src/mcp/handlers-share.js';
import type { MemoryConfig } from '../src/schemas/memory-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(__dirname, 'fixtures/default.rc0'), 'utf-8');

const sampleConfig: MemoryConfig = {
  version: 1,
  slotNumber: 2,
  name: 'SHARE TEST',
  inputFx: {
    banks: [{
      bank: 'A',
      slots: [{
        slot: 'A',
        effect: 'REVERB',
        enabled: true,
        params: [{ name: 'TIME', value: '2.5' }],
      }],
    }],
  },
  trackFx: { banks: [] },
};

describe('share envelope', () => {
  it('builds and validates memory envelope', () => {
    const envelope = memoryConfigToShare(sampleConfig, { source: 'user' });
    expect(envelope.format).toBe('rc505mk2-share');
    expect(envelope.kind).toBe('memory');
    expect(envelope.payload.name).toBe('SHARE TEST');
    expect(() => ShareEnvelopeSchema.parse(envelope)).not.toThrow();
  });

  it('rejects invalid envelope', () => {
    expect(() => parseShareEnvelopeJson(JSON.stringify({ format: 'wrong' }))).toThrow();
  });

  it('extracts rack from memory bank', () => {
    const rack = extractRackFromMemory(sampleConfig, 'inputFx', 'A');
    expect(rack.inputFx).toHaveLength(1);
    expect(rack.inputFx[0]!.effect).toBe('REVERB');
    expect(rack.trackFx).toHaveLength(0);
  });

  it('extracts fx module from memory slot', () => {
    const mod = extractFxModuleFromMemory(sampleConfig, 'inputFx', 'A', 'A');
    expect(mod.effect).toBe('REVERB');
    expect(mod.params.some(p => p.name === 'TIME')).toBe(true);
  });
});

describe('share round-trip handlers', () => {
  it('export_share → import_share round-trips memory', () => {
    const exported = handleExportShare({
      kind: 'memory',
      config: sampleConfig,
      source: 'user',
    }) as { envelope: { kind: string; payload: MemoryConfig } };

    expect(exported.envelope.kind).toBe('memory');

    const imported = handleImportShare({
      envelope: exported.envelope,
    }) as { kind: string; payload: MemoryConfig };

    expect(imported.kind).toBe('memory');
    expect(imported.payload.name).toBe('SHARE TEST');
    expect(imported.payload.inputFx.banks[0]!.slots[0]!.effect).toBe('REVERB');
  });

  it('fixture RC0 → export → import preserves structure', () => {
    const { xmlA, xmlB } = memoryConfigToRc0Pair(template, sampleConfig);
    const parsed = parseRC0PairActive(xmlA, xmlB, 2);

    const exported = handleExportShare({
      kind: 'memory',
      config: parsed,
    }) as { envelope: unknown };

    const imported = handleImportShare({
      json: JSON.stringify(exported.envelope),
    }) as { payload: MemoryConfig };

    expect(imported.payload.slotNumber).toBe(2);
    expect(imported.payload.inputFx.banks.find(b => b.bank === 'A')?.slots[0]?.effect).toBe('REVERB');
  });

  it('exports rack scope from config', () => {
    const result = handleExportShare({
      kind: 'rack',
      config: sampleConfig,
      section: 'inputFx',
      bank: 'A',
    }) as { envelope: { kind: string; payload: { inputFx: unknown[] } } };

    expect(result.envelope.kind).toBe('rack');
    expect(result.envelope.payload.inputFx.length).toBeGreaterThan(0);
  });
});
