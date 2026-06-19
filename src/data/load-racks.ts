import racksData from './racks.json' with { type: 'json' };
import type { Rack } from '../types/rack.js';

/**
 * Load the bundled rack presets from the static JSON data.
 */
export function loadBundledRacks(): Rack[] {
  return (racksData as { racks: Rack[] }).racks;
}
