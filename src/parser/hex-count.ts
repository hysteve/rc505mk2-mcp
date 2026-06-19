/**
 * RC0 hex count utilities.
 *
 * RC0 files store a 4-digit hex counter that increments with each save.
 * The device loads the file (A or B) with the higher count.
 */

/** Parse a 4-digit hex count string to a number. */
export function parseHexCount(countStr: string): number {
  return parseInt(countStr, 16);
}

/** Format a number as a 4-digit hex count string. */
export function formatHexCount(count: number): string {
  return count.toString(16).toUpperCase().padStart(4, '0');
}

/** Extract the <count> value from an RC0 file string. */
export function extractCount(xml: string): string {
  const match = xml.match(/<count>([^<]+)<\/count>/);
  return match ? match[1] : '0000';
}
