/**
 * Write a minimal valid PNG icon for MCPB packaging.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'plugin', 'assets');
mkdirSync(outDir, { recursive: true });

// 16x16 dark square PNG
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAI0lEQVQ4T2NkYGD4z0ABYBxVSFUBqGoG' +
    'qgZQ1QxUNQNVzUDVDFQ1A1XNQFUzUNUMVDUDVQMAAP//AwD5FQ0X0Q8n8QAAAABJRU5ErkJggg==',
  'base64',
);

writeFileSync(join(outDir, 'icon.png'), png);
console.log(`Wrote ${join(outDir, 'icon.png')}`);
