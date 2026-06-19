/**
 * Template loader — provides the default RC0 template.
 *
 * The template is embedded at build time by scripts/embed-template.ts.
 */

import { DEFAULT_TEMPLATE } from './default-template.js';

/**
 * Get the default RC0 template string.
 * @param override - Optional template string to use instead of the embedded one.
 * @returns The template string.
 */
export function getDefaultTemplate(override?: string): string {
  if (override) return override;
  return DEFAULT_TEMPLATE;
}
