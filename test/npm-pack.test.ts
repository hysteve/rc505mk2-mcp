/**
 * Smoke test: npm pack → install in temp dir → verify bundled data resolves.
 * Skipped in CI if npm pack fails; runs locally before publish.
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const repoRoot = new URL('..', import.meta.url).pathname;

describe('npm pack install smoke', () => {
  it('loads bundled FX modules after pack install', () => {
    const tmpInstall = mkdtempSync(join(tmpdir(), 'rc505-pack-'));
    let packOutput: string | undefined;

    try {
      packOutput = execSync('npm pack --silent', {
        cwd: repoRoot,
        encoding: 'utf-8',
      }).trim();
      const tgz = join(repoRoot, packOutput);

      execSync('npm init -y', { cwd: tmpInstall, stdio: 'pipe' });
      execSync(`npm install "${tgz}"`, { cwd: tmpInstall, stdio: 'pipe' });

      const installedRoot = join(tmpInstall, 'node_modules', 'rc505mk2-mcp');
      expect(existsSync(join(installedRoot, 'data', 'fx-modules', '_meta.json'))).toBe(true);
      expect(existsSync(join(installedRoot, 'dist', 'mcp', 'server.js'))).toBe(true);

      const result = execSync('node --input-type=module -e "' +
        "import { FxModuleStore } from 'rc505mk2-mcp/node';" +
        "const s = new FxModuleStore();" +
        "console.log(JSON.stringify({ count: s.loadAll().length, dir: s.getDataDir() }));" +
        '"', {
        cwd: tmpInstall,
        encoding: 'utf-8',
      });

      const parsed = JSON.parse(result.trim()) as { count: number; dir: string };
      expect(parsed.count).toBeGreaterThan(20);
      expect(parsed.dir).toContain('data/fx-modules');
    } finally {
      rmSync(tmpInstall, { recursive: true, force: true });
      if (typeof packOutput !== 'undefined') {
        try { rmSync(join(repoRoot, packOutput)); } catch { /* ignore */ }
      }
    }
  }, 120_000);
});
