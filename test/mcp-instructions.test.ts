import { describe, it, expect } from 'vitest';
import { SERVER_INSTRUCTIONS } from '../src/mcp/instructions.js';

describe('SERVER_INSTRUCTIONS', () => {
  it('covers Adapt vs Build, fxModuleId, TFX rules, and upload path', () => {
    expect(SERVER_INSTRUCTIONS).toContain('Adapt vs Build');
    expect(SERVER_INSTRUCTIONS).toContain('list_rack_presets');
    expect(SERVER_INSTRUCTIONS).toContain('list_fx_modules');
    expect(SERVER_INSTRUCTIONS).toContain('fxModuleId');
    expect(SERVER_INSTRUCTIONS).toContain('pairsWith');
    expect(SERVER_INSTRUCTIONS).toContain('BEAT_SCATTER');
    expect(SERVER_INSTRUCTIONS).toContain('TFX Slot A');
    expect(SERVER_INSTRUCTIONS).toContain('upload_memory');
    expect(SERVER_INSTRUCTIONS).toContain('Never meta-search');
  });
});
