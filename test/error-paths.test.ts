/**
 * Error path tests for MCP handlers and generator edge cases.
 *
 * Covers: unknown FX types, malformed configs, and out-of-range slot numbers.
 * Note: handleBuildRackConfig and handleGetRackPreset tests — Phase 1 (unified MCP).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  handleLookupFxParams,
} from '../src/mcp/handlers.js';
import { memoryConfigToRc0 } from '../src/generator/rc0-generator.js';
import { parseRC0 } from '../src/parser/rc0-parser.js';
import type { MemoryConfig } from '../src/types/memory-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(resolve(__dirname, 'fixtures/default.rc0'), 'utf-8');

// ── MCP handler error paths ─────────────────────────────────────────

describe('handleLookupFxParams — error paths', () => {
  it('returns error for completely unknown FX name', () => {
    const result = handleLookupFxParams({ fx_name: 'FOOBAR' }) as { error: string };
    expect(result.error).toContain('Unknown FX type');
  });

  it('returns error for empty FX name', () => {
    const result = handleLookupFxParams({ fx_name: '' }) as { error: string };
    expect(result.error).toContain('Unknown FX type');
  });

  it('resolves case-insensitive FX names', () => {
    const result = handleLookupFxParams({ fx_name: 'delay' }) as { fx_name: string };
    expect(result.fx_name).toBe('DELAY');
  });
});

// ── Generator error paths ───────────────────────────────────────────

describe('memoryConfigToRc0 — edge cases', () => {
  it('handles config with unknown FX name gracefully', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 1,
      name: 'UNKNOWN FX',
      inputFx: {
        banks: [{
          bank: 'A',
          slots: [{
            slot: 'A',
            effect: 'TOTALLY_FAKE_FX',
            enabled: true,
            params: [{ name: 'LEVEL', value: '50' }],
          }],
        }],
      },
      trackFx: { banks: [] },
    };

    // Should not throw — generator skips unknown FX params silently
    const xml = memoryConfigToRc0(template, config);
    expect(xml.length).toBeGreaterThan(0);
  });

  it('handles empty banks array', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 1,
      name: 'NO BANKS',
      inputFx: { banks: [] },
      trackFx: { banks: [] },
    };

    const xml = memoryConfigToRc0(template, config);
    expect(xml.length).toBeGreaterThan(0);
  });

  it('handles config with empty slots array in bank', () => {
    const config: MemoryConfig = {
      version: 1,
      slotNumber: 1,
      name: 'EMPTY BANK',
      inputFx: {
        banks: [{
          bank: 'A',
          slots: [],
        }],
      },
      trackFx: { banks: [] },
    };

    const xml = memoryConfigToRc0(template, config);
    expect(xml.length).toBeGreaterThan(0);
  });
});

// ── Parser edge cases ───────────────────────────────────────────────

describe('parseRC0 — edge cases', () => {
  it('parses default template without errors', () => {
    const config = parseRC0(template, 1);
    expect(config.version).toBe(1);
    expect(config.slotNumber).toBe(1);
  });

  it('accepts any slot number', () => {
    const config = parseRC0(template, 99);
    expect(config.slotNumber).toBe(99);
  });
});
