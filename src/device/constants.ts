/**
 * Device detection constants for the RC-505mk2.
 */

import { platform } from 'os';

/** The signature path that identifies an RC-505mk2 volume */
export const DEVICE_SIGNATURE_PATH = 'ROLAND/DATA';

/** The specific file used to confirm the device (slot 1 always exists) */
export const DEVICE_SIGNATURE_FILE = 'ROLAND/DATA/MEMORY001A.RC0';

/** The data directory on the device where memory files live */
export const DEVICE_DATA_DIR = 'ROLAND/DATA';

/** Get platform-specific volume search roots */
export function getVolumeSearchPaths(): string[] {
  const os = platform();

  switch (os) {
    case 'darwin':
      return ['/Volumes'];
    case 'linux':
      return [
        `/media/${process.env.USER ?? process.env.LOGNAME ?? 'user'}`,
        '/mnt',
        '/run/media',
      ];
    case 'win32':
      // Drive letters D: through Z:
      return Array.from({ length: 23 }, (_, i) =>
        String.fromCharCode(68 + i) + ':',
      );
    default:
      return [];
  }
}
