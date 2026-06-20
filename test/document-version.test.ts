import { describe, it, expect } from 'vitest';
import {
  SCHEMA_VERSIONS,
  UnsupportedSchemaVersionError,
  readDocumentVersion,
  migrateDocument,
  stampDocument,
  parseFxModuleDocument,
  parseRackDocument,
  parseSavedMemoryDocument,
} from '../src/schemas/document-version.js';

const minimalFxModule = {
  id: 'test-module',
  effect: 'REVERB',
  title: 'Test',
  category: 'space',
  context: ['ifx'],
  usage: 'both',
  description: 'Test module',
  params: [{ name: 'TYPE', value: 'HALL1' }],
};

const minimalRack = {
  id: 'test-rack',
  section: 'custom',
  title: 'Test Rack',
  icon: '',
  genres: ['Test'],
  inputType: 'mic',
  description: 'Test rack',
  inputFx: [],
  trackFx: [],
  tips: [],
};

describe('readDocumentVersion', () => {
  it('defaults missing version to 1', () => {
    expect(readDocumentVersion('fxModule', minimalFxModule)).toBe(1);
    expect(readDocumentVersion('memoryConfig', { name: 'X', slotNumber: 1 })).toBe(1);
  });

  it('reads explicit schemaVersion', () => {
    expect(readDocumentVersion('rack', { ...minimalRack, schemaVersion: 1 })).toBe(1);
  });

  it('reads MemoryConfig.version field', () => {
    expect(readDocumentVersion('memoryConfig', { version: 1, slotNumber: 1 })).toBe(1);
  });
});

describe('migrateDocument', () => {
  it('accepts legacy files without schemaVersion', () => {
    const migrated = migrateDocument('fxModule', minimalFxModule);
    expect(migrated.id).toBe('test-module');
  });

  it('rejects future schema versions', () => {
    expect(() =>
      migrateDocument('fxModule', { ...minimalFxModule, schemaVersion: 99 }),
    ).toThrow(UnsupportedSchemaVersionError);
  });
});

describe('stampDocument', () => {
  it('stamps schemaVersion on fxModule and rack', () => {
    expect(stampDocument('fxModule', minimalFxModule).schemaVersion).toBe(SCHEMA_VERSIONS.fxModule);
    expect(stampDocument('rack', minimalRack).schemaVersion).toBe(SCHEMA_VERSIONS.rack);
  });

  it('stamps version on memoryConfig', () => {
    expect(stampDocument('memoryConfig', { slotNumber: 1 }).version).toBe(SCHEMA_VERSIONS.memoryConfig);
  });
});

describe('parse helpers', () => {
  it('parseFxModuleDocument fills default schemaVersion', () => {
    const mod = parseFxModuleDocument(minimalFxModule);
    expect(mod.schemaVersion).toBe(1);
  });

  it('parseRackDocument fills default schemaVersion', () => {
    const rack = parseRackDocument(minimalRack);
    expect(rack.schemaVersion).toBe(1);
  });

  it('parseSavedMemoryDocument accepts legacy envelope without schemaVersion', () => {
    const saved = parseSavedMemoryDocument({
      id: 'slot-01-test',
      savedAt: '2026-01-01T00:00:00.000Z',
      config: {
        version: 1,
        slotNumber: 1,
        name: 'Test',
        inputFx: { banks: [] },
        trackFx: { banks: [] },
      },
    });
    expect(saved.schemaVersion).toBe(1);
  });
});
