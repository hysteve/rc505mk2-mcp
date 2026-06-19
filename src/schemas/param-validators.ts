/**
 * Dynamic per-FX-type parameter validation.
 * Builds Zod refinements from PARAM_MAP and TRANSFORM_META so that
 * validation doesn't duplicate the transform definitions.
 */

import { z } from 'zod';
import { FxParamSchema } from './fx-param.js';
import { PARAM_MAP } from '../params/param-map.js';
import { TRANSFORM_META } from '../mcp/transform-meta.js';

import type { FxParam } from './fx-param.js';

/**
 * Build a Zod schema that validates FxParam[] for a specific effect type.
 * Uses PARAM_MAP to know which param names are valid,
 * and TRANSFORM_META to know valid value ranges/enums.
 *
 * Unknown params are flagged as warnings (custom issues) but don't block parsing.
 */
export function buildFxParamsSchema(effectName: string): z.ZodType<FxParam[]> {
  const paramDefs = PARAM_MAP[effectName];
  if (!paramDefs) return z.array(FxParamSchema);

  const validNames = new Set(Object.keys(paramDefs));

  return z.array(FxParamSchema).superRefine((params, ctx) => {
    for (const [i, param] of params.entries()) {
      if (!validNames.has(param.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i, 'name'],
          message: `Unknown param "${param.name}" for ${effectName}. Valid: ${[...validNames].join(', ')}`,
        });
        continue;
      }

      const def = paramDefs[param.name];
      if (!def?.transform) continue;

      const meta = TRANSFORM_META.get(def.transform);
      if (!meta) continue;

      if (meta.type === 'enum') {
        // Enum transforms also accept numeric fallback — only warn on clearly invalid
        const upper = param.value.toUpperCase();
        const isValidEnum = meta.values.some(v => v.toUpperCase() === upper);
        const isNumeric = /^-?\d+(\.\d+)?$/.test(param.value);
        if (!isValidEnum && !isNumeric) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [i, 'value'],
            message: `Invalid value "${param.value}" for ${effectName}.${param.name}. Expected one of: ${meta.values.join(', ')}`,
          });
        }
      } else if (meta.type === 'numeric') {
        const num = parseFloat(param.value);
        if (isNaN(num)) {
          // Some numeric transforms also accept note values (delayTime, rollTime)
          // — don't flag non-numeric strings for those
          const desc = meta.description ?? '';
          const acceptsNotes = desc.includes('note value');
          if (!acceptsNotes) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [i, 'value'],
              message: `Expected numeric value for ${effectName}.${param.name}, got "${param.value}"`,
            });
          }
        } else if (num < meta.range.min || num > meta.range.max) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [i, 'value'],
            message: `Value ${param.value} out of range for ${effectName}.${param.name}. Expected ${meta.range.min}-${meta.range.max}`,
          });
        }
      }
    }
  });
}

/**
 * Validate an FxModule's params against its declared effect type.
 * Returns Zod parse result with any param-level issues.
 */
export function validateFxModuleParams(
  effectName: string,
  params: FxParam[],
): z.SafeParseReturnType<FxParam[], FxParam[]> {
  const schema = buildFxParamsSchema(effectName);
  return schema.safeParse(params);
}
