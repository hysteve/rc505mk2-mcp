/**
 * Doctor command — verify install, paths, and device connectivity.
 */

import { existsSync, accessSync, constants, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { detectDevice } from '../device/detect.js';
import { DEVICE_DATA_DIR } from '../device/constants.js';
import { FxModuleStore } from '../mcp/fx-module-store.js';
import { PresetStore } from '../stores/preset-store.js';
import {
  resolveBundledDataDir,
  resolveBundledFxModulesDir,
  resolveUserDataDir,
} from '../stores/paths.js';
import { readUserStoreMeta, USER_STORE_VERSION } from '../stores/user-meta.js';
import { SCHEMA_VERSIONS } from '../schemas/document-version.js';
import { loadBundledRacks } from '../data/load-racks.js';

export interface DoctorCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export function runDoctorChecks(): DoctorCheck[] {
  const checks: DoctorCheck[] = [];

  // Node version
  const nodeMajor = parseInt(process.version.slice(1).split('.')[0] ?? '0', 10);
  checks.push({
    name: 'Node.js',
    ok: nodeMajor >= 18,
    detail: nodeMajor >= 18
      ? `${process.version} (OK)`
      : `${process.version} — Node 18+ required`,
  });

  // MCP SDK
  const require = createRequire(import.meta.url);
  try {
    require.resolve('@modelcontextprotocol/sdk/package.json');
    checks.push({ name: 'MCP SDK', ok: true, detail: 'Installed' });
  } catch {
    checks.push({
      name: 'MCP SDK',
      ok: false,
      detail: '@modelcontextprotocol/sdk not found — run npm install',
    });
  }

  // Bundled data directory
  const bundledDir = resolveBundledDataDir();
  const fxDir = resolveBundledFxModulesDir();
  const fxDirExists = existsSync(fxDir);
  checks.push({
    name: 'Bundled data path',
    ok: fxDirExists,
    detail: fxDirExists ? bundledDir : `Not found — expected ${fxDir}`,
  });

  // FX modules load
  if (fxDirExists) {
    const modules = new FxModuleStore(fxDir).loadAll();
    checks.push({
      name: 'Bundled FX modules',
      ok: modules.length > 0,
      detail: modules.length > 0
        ? `${modules.length} modules loaded`
        : 'No modules found in bundled data',
    });
  }

  // Bundled racks (embedded at build time)
  const racks = loadBundledRacks();
  checks.push({
    name: 'Bundled rack presets',
    ok: racks.length > 0,
    detail: `${racks.length} racks available`,
  });

  // PresetStore merge smoke test
  try {
    const store = new PresetStore();
    const listed = store.listFxModules();
    checks.push({
      name: 'PresetStore',
      ok: listed.length > 0,
      detail: `${listed.length} FX modules (bundled + user)`,
    });
  } catch (err) {
    checks.push({
      name: 'PresetStore',
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  // User data dir writable
  const userDir = resolveUserDataDir();
  try {
    mkdirSync(userDir, { recursive: true });
    accessSync(userDir, constants.W_OK);
    const storeMeta = readUserStoreMeta();
    const metaDetail = storeMeta
      ? `${userDir} (writable, store v${storeMeta.storeVersion})`
      : `${userDir} (writable, no presets saved yet)`;
    checks.push({
      name: 'User data dir',
      ok: true,
      detail: metaDetail,
    });
  } catch (err) {
    checks.push({
      name: 'User data dir',
      ok: false,
      detail: `${userDir} — ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  checks.push({
    name: 'Schema versions',
    ok: true,
    detail:
      `fxModule/rack/savedMemory v${SCHEMA_VERSIONS.fxModule}, ` +
      `memoryConfig v${SCHEMA_VERSIONS.memoryConfig}, store v${USER_STORE_VERSION}`,
  });

  // Device detection (informational — OK if not connected)
  const device = detectDevice();
  checks.push({
    name: 'RC-505mk2 device',
    ok: true,
    detail: device
      ? `Connected at ${device.path} (${join(device.path, DEVICE_DATA_DIR)})`
      : 'Not connected (enable USB Storage mode to upload)',
  });

  return checks;
}

export function formatDoctorReport(checks: DoctorCheck[]): string {
  const lines = ['RC-505mk2 Doctor\n'];
  let allRequiredOk = true;

  for (const check of checks) {
    const icon = check.ok ? '✓' : '✗';
    lines.push(`  ${icon} ${check.name}: ${check.detail}`);
    if (!check.ok && check.name !== 'RC-505mk2 device') {
      allRequiredOk = false;
    }
  }

  lines.push('');
  lines.push(allRequiredOk ? 'All checks passed.' : 'Some checks failed — see above.');
  return lines.join('\n');
}

export function doctorCommand(): number {
  const checks = runDoctorChecks();
  console.log(formatDoctorReport(checks));
  const failed = checks.filter(c => !c.ok && c.name !== 'RC-505mk2 device');
  return failed.length === 0 ? 0 : 1;
}
