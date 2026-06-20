/**
 * Write share artifacts to ~/.rc505mk2/exports/
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveUserExportsDir, slugifyId } from '../stores/paths.js';
import type { ShareEnvelope } from './envelope.js';

export function writeShareJson(
  envelope: ShareEnvelope,
  exportsDir?: string,
): string {
  const dir = exportsDir ?? resolveUserExportsDir();
  mkdirSync(dir, { recursive: true });

  const payloadName =
    envelope.payload && typeof envelope.payload === 'object' && 'name' in envelope.payload
      ? String((envelope.payload as { name?: string }).name ?? '')
      : '';
  const name = (envelope.meta?.name ?? payloadName) || 'preset';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${envelope.kind}-${slugifyId(name)}-${timestamp}.rc505mk2.json`;
  const filePath = join(dir, filename);

  writeFileSync(filePath, JSON.stringify(envelope, null, 2), 'utf-8');
  return filePath;
}

export function writeBinaryExport(
  filename: string,
  data: Uint8Array,
  exportsDir?: string,
): string {
  const dir = exportsDir ?? resolveUserExportsDir();
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, filename);
  writeFileSync(filePath, data);
  return filePath;
}
