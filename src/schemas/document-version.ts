/**
 * Schema versioning for on-disk preset documents.
 *
 * Each document kind has an integer schema version stamped on write and checked
 * on read. Missing version fields are treated as v1 (bundled data, legacy files).
 *
 * MemoryConfig uses the field name `version` (historical); other kinds use
 * `schemaVersion`.
 */

import { FxModuleSchema, type FxModule } from './fx-module.js';
import { RackSchema, type Rack } from './rack.js';
import { MemoryConfigSchema, type MemoryConfig } from './memory-config.js';
import { SavedMemoryConfigSchema, type SavedMemoryConfig } from './saved-memory.js';

/** Current schema version per document kind. Bump when the on-disk shape changes. */
export const SCHEMA_VERSIONS = {
  fxModule: 1,
  rack: 1,
  memoryConfig: 1,
  savedMemory: 1,
} as const;

export type DocumentKind = keyof typeof SCHEMA_VERSIONS;

export class UnsupportedSchemaVersionError extends Error {
  constructor(
    readonly kind: DocumentKind,
    readonly found: number,
    readonly supported: number,
  ) {
    super(
      `Unsupported ${kind} schema version ${found} (this package supports up to ${supported}). ` +
        'Update rc505mk2-mcp or re-save the preset with a newer version.',
    );
    this.name = 'UnsupportedSchemaVersionError';
  }
}

/** Read schema version from raw JSON before validation. */
export function readDocumentVersion(kind: DocumentKind, raw: Record<string, unknown>): number {
  if (kind === 'memoryConfig') {
    return typeof raw.version === 'number' ? raw.version : 1;
  }
  if (kind === 'savedMemory') {
    return typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 1;
  }
  return typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 1;
}

type MigrationFn = (data: Record<string, unknown>) => Record<string, unknown>;

/** Per-kind migration chains: index = fromVersion → toVersion+1 transform. */
const MIGRATIONS: Partial<Record<DocumentKind, MigrationFn[]>> = {
  fxModule: [],
  rack: [],
  memoryConfig: [],
  savedMemory: [],
};

/** Apply forward migrations from file version to current. */
export function migrateDocument(kind: DocumentKind, raw: unknown): Record<string, unknown> {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`Invalid ${kind} document: expected a JSON object.`);
  }

  const data = { ...(raw as Record<string, unknown>) };
  let version = readDocumentVersion(kind, data);
  const current = SCHEMA_VERSIONS[kind];

  if (version > current) {
    throw new UnsupportedSchemaVersionError(kind, version, current);
  }

  const chain = MIGRATIONS[kind] ?? [];
  while (version < current) {
    const step = chain[version - 1];
    if (!step) {
      throw new Error(`Missing migration for ${kind} v${version} → v${version + 1}.`);
    }
    Object.assign(data, step(data));
    version += 1;
  }

  return data;
}

/** Stamp current schema version before writing to disk. */
export function stampDocument(kind: DocumentKind, data: Record<string, unknown>): Record<string, unknown> {
  if (kind === 'memoryConfig') {
    return { ...data, version: SCHEMA_VERSIONS.memoryConfig };
  }
  return { ...data, schemaVersion: SCHEMA_VERSIONS[kind] };
}

export function parseFxModuleDocument(raw: unknown): FxModule {
  return FxModuleSchema.parse(migrateDocument('fxModule', raw));
}

export function parseRackDocument(raw: unknown): Rack {
  return RackSchema.parse(migrateDocument('rack', raw));
}

export function parseMemoryConfigDocument(raw: unknown): MemoryConfig {
  return MemoryConfigSchema.parse(migrateDocument('memoryConfig', raw));
}

export function parseSavedMemoryDocument(raw: unknown): SavedMemoryConfig {
  return SavedMemoryConfigSchema.parse(migrateDocument('savedMemory', raw));
}
