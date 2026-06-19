/**
 * Base Zod schemas for FX parameters and slot identifiers.
 * These are the atomic building blocks used by all higher-level schemas.
 */

import { z } from 'zod';

export const FxSlotIdSchema = z.enum(['A', 'B', 'C', 'D']);

export const FxContextSchema = z.enum(['ifx', 'tfx']);

export const FxParamSchema = z.object({
  name: z.string().min(1),
  value: z.string(),
});

export type FxSlotId = z.infer<typeof FxSlotIdSchema>;
export type FxParam = z.infer<typeof FxParamSchema>;
