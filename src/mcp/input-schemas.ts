/**
 * Zod input schemas for MCP tool handlers.
 * Applied at the MCP boundary to validate incoming tool arguments.
 */

import { z } from 'zod';
import { MemoryConfigSchema } from '../schemas/memory-config.js';
import { FxModuleSchema } from '../schemas/fx-module.js';
import { RackSchema } from '../schemas/rack.js';

// ── Device MCP input schemas ──────────────────────────────────────

export const UploadMemoryInputSchema = z
  .object({
    config: MemoryConfigSchema.optional(),
    rack_id: z.string().min(1).optional(),
    slot_number: z.number().int().min(1).max(99).optional(),
    name: z.string().optional(),
    device_path: z.string().optional(),
    backup_dir: z.string().optional(),
    skip_backup: z.boolean().optional(),
    mode: z.enum(['merge', 'overwrite']).optional(),
    eject_after: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const hasConfig = data.config != null;
    const hasRack = data.rack_id != null;

    if (hasConfig && hasRack) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide either config or rack_id, not both.',
      });
    }
    if (!hasConfig && !hasRack) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide config or rack_id with slot_number.',
      });
    }
    if (hasRack && data.slot_number == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['slot_number'],
        message: 'slot_number is required when using rack_id.',
      });
    }
  });

// ── Preset MCP input schemas ──────────────────────────────────────

export const ListFxModulesInputSchema = z.object({
  category: z.string().optional(),
  context: z.enum(['ifx', 'tfx']).optional(),
  usage: z.enum(['chain', 'individual', 'both']).optional(),
  effect: z.string().optional(),
  tag: z.string().optional(),
});

export const GetFxModuleInputSchema = z.object({
  module_id: z.string().min(1),
});

export const CreateFxModuleInputSchema = FxModuleSchema.partial({ id: true });

export const UpdateFxModuleInputSchema = z.object({
  module_id: z.string().min(1),
  data: FxModuleSchema.partial(),
});

export const DeleteFxModuleInputSchema = z.object({
  module_id: z.string().min(1),
});

export const ListRackPresetsInputSchema = z.object({
  genre: z.string().optional(),
  tag: z.string().optional(),
  section: z.string().optional(),
  fx_type: z.enum(['ifx', 'tfx']).optional(),
});

export const GetRackPresetInputSchema = z.object({
  rack_id: z.string().min(1),
});

export const CreateRackPresetInputSchema = RackSchema.partial({
  id: true,
  section: true,
  icon: true,
  inputType: true,
  description: true,
  tips: true,
}).required({
  title: true,
  genres: true,
  inputFx: true,
  trackFx: true,
});

export const UpdateRackPresetInputSchema = z.object({
  rack_id: z.string().min(1),
  data: RackSchema.partial(),
});

export const DeleteRackPresetInputSchema = z.object({
  rack_id: z.string().min(1),
});

export const SaveMemoryConfigInputSchema = z.object({
  config: MemoryConfigSchema,
  genres: z.array(z.string()).optional(),
});

export const ListMemoryConfigsInputSchema = z.object({
  genre: z.string().optional(),
  slot_number: z.number().int().min(1).max(99).optional(),
});

export const GenerateMemoryInputSchema = z.object({
  config: MemoryConfigSchema,
});

export const BuildRackConfigInputSchema = z.object({
  name: z.string().optional(),
  slot_number: z.number().int().min(1).max(99),
  rack_id: z.string().optional(),
  input_fx: z.array(z.record(z.unknown())).optional(),
  track_fx: z.array(z.record(z.unknown())).optional(),
  tempo: z.number().min(40).max(300).optional(),
});

export const ResolveRackInputSchema = z.object({
  rack_id: z.string().min(1),
});

export const ReadDeviceSlotInputSchema = z.object({
  slot_number: z.number().int().min(1).max(99),
  device_path: z.string().optional(),
});

export const ListDeviceSlotsInputSchema = z.object({
  device_path: z.string().optional(),
});

export const GetMemoryConfigInputSchema = z.object({
  memory_id: z.string().min(1),
});

export const ExportZipInputSchema = z.object({
  config: MemoryConfigSchema.optional(),
  rack_id: z.string().optional(),
  slot_number: z.number().int().min(1).max(99).optional(),
  name: z.string().optional(),
  device_path: z.string().optional(),
  write_to_disk: z.boolean().optional(),
});

export const ImportZipInputSchema = z.object({
  zip_base64: z.string().min(1),
  save_to_store: z.boolean().optional(),
});

// ── Validation helper ───────────────────────────────────────────────

/**
 * Validate MCP tool input. Returns the parsed data or an error object.
 * This is the standard entry-point validation for all MCP handlers.
 */
export function validateInput<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const issues = result.error.issues
    .map(i => `${i.path.join('.')}: ${i.message}`)
    .join('; ');
  return { success: false, error: `Invalid input: ${issues}` };
}
