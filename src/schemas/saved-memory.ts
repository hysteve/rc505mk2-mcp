/**
 * Zod schema for saved MemoryConfig files in ~/.rc505mk2/memories/.
 */

import { z } from 'zod';
import { MemoryConfigSchema } from './memory-config.js';

export const SavedMemoryConfigSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  id: z.string().min(1),
  config: MemoryConfigSchema,
  genres: z.array(z.string()).optional(),
  sourceRackId: z.string().optional(),
  savedAt: z.string(),
});

export type SavedMemoryConfig = z.infer<typeof SavedMemoryConfigSchema>;
