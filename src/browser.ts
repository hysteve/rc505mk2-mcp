/**
 * Browser-specific exports for @rc505mk2/lib.
 * Contains DOM-dependent functionality (Blob, download triggers).
 */

export { generatePresetZipBuffer, generateMemoryZipBuffer } from './download/rc0-zip.js';

/** Trigger a browser file download from a Blob */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Create a downloadable Blob from a ZIP buffer */
export function zipBufferToBlob(buffer: Uint8Array): Blob {
  return new Blob([buffer as unknown as BlobPart], { type: 'application/zip' });
}
