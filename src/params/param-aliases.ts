/**
 * Parameter-name aliases: alternative spellings accepted on input and
 * normalized to the canonical PARAM_MAP key. Canonical names follow the
 * RC-505mk2 Parameter Guide (src/data/fx-reference.json). The parser only
 * ever emits canonical names.
 */

import { PARAM_MAP } from './param-map.js';

/** effect (RC0 name) → alias (upper-case) → canonical PARAM_MAP key */
export const PARAM_ALIASES: Record<string, Record<string, string>> = {
  EQ: {
    'LO GAIN': 'LO',
    'LOW': 'LO',
    'LOW GAIN': 'LO',
    'HI GAIN': 'HIGH',
    'HI': 'HIGH',
    'HIGH GAIN': 'HIGH',
  },
};

/**
 * Resolve a user-supplied param name to its canonical PARAM_MAP key for the
 * given effect. Unknown names are returned upper-cased and unchanged so the
 * caller can detect them with a PARAM_MAP lookup.
 */
export function resolveParamName(effect: string, name: string): string {
  const upper = name.toUpperCase().trim();
  const defs = PARAM_MAP[effect];
  if (defs && upper in defs) return upper;
  const alias = PARAM_ALIASES[effect]?.[upper];
  if (alias) return alias;
  return upper;
}
