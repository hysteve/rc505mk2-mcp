import racksData from './racks.json' with { type: 'json' };
import type { Rack } from '../types/rack.js';
import { parseRackDocument } from '../schemas/document-version.js';

/**
 * Load the bundled rack presets from the static JSON data.
 */
export function loadBundledRacks(): Rack[] {
  const data = racksData as { racks: unknown[] };
  return data.racks.map(r => parseRackDocument(r));
}
