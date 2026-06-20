import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateMemoryZipFromConfig,
  importMemoryZip,
  zipToBase64,
  base64ToZip,
} from '../src/share/zip.js';
import { handleExportZip, handleImportZip } from '../src/mcp/handlers-share.js';
import type { MemoryConfig } from '../src/schemas/memory-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(__dirname, 'fixtures/default.rc0'), 'utf-8');

const sampleConfig: MemoryConfig = {
  version: 1,
  slotNumber: 4,
  name: 'ZIP TEST',
  inputFx: { banks: [] },
  trackFx: { banks: [] },
  master: { tempo: 110 },
};

describe('memory ZIP', () => {
  it('generates and imports RC0 ZIP', () => {
    const zipBytes = generateMemoryZipFromConfig(template, sampleConfig);
    const imported = importMemoryZip(zipBytes);

    expect(imported.slot_number).toBe(4);
    expect(imported.config.name).toBe('ZIP TEST');
    expect(imported.files.some(f => /MEMORY004A\.RC0/i.test(f))).toBe(true);
  });

  it('round-trips base64 through handlers', () => {
    const exported = handleExportZip({ config: sampleConfig }) as {
      zip_base64: string;
      name: string;
    };

    expect(exported.name).toBe('ZIP TEST');

    const imported = handleImportZip({
      zip_base64: exported.zip_base64,
    }) as { config: MemoryConfig };

    expect(imported.config.name).toBe('ZIP TEST');
    expect(imported.config.master?.tempo).toBe(110);
  });

  it('base64 helpers round-trip bytes', () => {
    const zipBytes = generateMemoryZipFromConfig(template, sampleConfig);
    const b64 = zipToBase64(zipBytes);
    const restored = base64ToZip(b64);
    expect(restored.length).toBe(zipBytes.length);
  });
});
