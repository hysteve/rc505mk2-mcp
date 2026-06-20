/**
 * rc505mk2-share JSON envelope for community preset sharing.
 */

import { z } from 'zod';
import { MemoryConfigSchema } from '../schemas/memory-config.js';
import { RackSchema } from '../schemas/rack.js';
import { FxModuleSchema } from '../schemas/fx-module.js';
import type { MemoryConfig } from '../schemas/memory-config.js';
import type { Rack } from '../schemas/rack.js';
import type { FxModule } from '../schemas/fx-module.js';

export const ShareKindSchema = z.enum(['memory', 'rack', 'fx_module']);
export type ShareKind = z.infer<typeof ShareKindSchema>;

export const ShareSourceSchema = z.enum(['device', 'user', 'bundled']);
export type ShareSource = z.infer<typeof ShareSourceSchema>;

export const ShareMetaSchema = z.object({
  name: z.string().optional(),
  slotNumber: z.number().int().min(1).max(99).optional(),
  source: ShareSourceSchema.optional(),
  section: z.enum(['inputFx', 'trackFx']).optional(),
  bank: z.enum(['A', 'B', 'C', 'D']).optional(),
  slot: z.enum(['A', 'B', 'C', 'D']).optional(),
  notes: z.string().optional(),
});

export type ShareMeta = z.infer<typeof ShareMetaSchema>;

const ShareEnvelopeBaseSchema = z.object({
  format: z.literal('rc505mk2-share'),
  formatVersion: z.literal(1),
  exportedAt: z.string(),
  meta: ShareMetaSchema.optional(),
});

export const MemoryShareEnvelopeSchema = ShareEnvelopeBaseSchema.extend({
  kind: z.literal('memory'),
  payload: MemoryConfigSchema,
});

export const RackShareEnvelopeSchema = ShareEnvelopeBaseSchema.extend({
  kind: z.literal('rack'),
  payload: RackSchema,
});

export const FxModuleShareEnvelopeSchema = ShareEnvelopeBaseSchema.extend({
  kind: z.literal('fx_module'),
  payload: FxModuleSchema,
});

export const ShareEnvelopeSchema = z.discriminatedUnion('kind', [
  MemoryShareEnvelopeSchema,
  RackShareEnvelopeSchema,
  FxModuleShareEnvelopeSchema,
]);

export type ShareEnvelope = z.infer<typeof ShareEnvelopeSchema>;

export function buildShareEnvelope(
  kind: 'memory',
  payload: MemoryConfig,
  meta?: ShareMeta,
): z.infer<typeof MemoryShareEnvelopeSchema>;
export function buildShareEnvelope(
  kind: 'rack',
  payload: Rack,
  meta?: ShareMeta,
): z.infer<typeof RackShareEnvelopeSchema>;
export function buildShareEnvelope(
  kind: 'fx_module',
  payload: FxModule,
  meta?: ShareMeta,
): z.infer<typeof FxModuleShareEnvelopeSchema>;
export function buildShareEnvelope(
  kind: ShareKind,
  payload: MemoryConfig | Rack | FxModule,
  meta?: ShareMeta,
): ShareEnvelope {
  const envelope = {
    format: 'rc505mk2-share' as const,
    formatVersion: 1 as const,
    exportedAt: new Date().toISOString(),
    kind,
    payload,
    meta,
  };
  return ShareEnvelopeSchema.parse(envelope);
}

export function parseShareEnvelope(data: unknown): ShareEnvelope {
  return ShareEnvelopeSchema.parse(data);
}

export function parseShareEnvelopeJson(json: string): ShareEnvelope {
  return parseShareEnvelope(JSON.parse(json));
}
