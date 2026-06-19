/**
 * Zod schema for FxModule — individual FX module presets.
 */

import { z } from 'zod';
import { FxContextSchema, FxParamSchema } from './fx-param.js';

export const FxModuleSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  effect: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  context: z.array(FxContextSchema).min(1),
  usage: z.enum(['chain', 'individual', 'both']),
  description: z.string(),
  params: z.array(FxParamSchema),
  sequencer: z.array(FxParamSchema).optional(),
  tags: z.array(z.string()).optional(),
  pairsWith: z.array(z.string()).optional(),
});

export type FxModule = z.infer<typeof FxModuleSchema>;
