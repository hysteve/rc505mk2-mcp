/**
 * RC-505mk2 device detection — scans mounted volumes for the ROLAND/DATA signature.
 */

import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { platform } from 'os';
import { getVolumeSearchPaths, DEVICE_SIGNATURE_FILE } from './constants.js';

export interface DeviceInfo {
  /** Full path to the device mount point (e.g., "/Volumes/RC-505MKII") */
  path: string;
  /** Volume name (e.g., "RC-505MKII") */
  volumeName: string;
}

/**
 * Detect a mounted RC-505mk2 device by scanning known volume mount points
 * for the ROLAND/DATA/MEMORY001A.RC0 signature.
 *
 * Returns the first matching device, or null if none found.
 */
export function detectDevice(): DeviceInfo | null {
  const searchPaths = getVolumeSearchPaths();
  const os = platform();

  for (const searchRoot of searchPaths) {
    if (!existsSync(searchRoot)) continue;

    if (os === 'win32') {
      // On Windows, each search path IS a potential mount (D:, E:, etc.)
      const signaturePath = join(searchRoot, DEVICE_SIGNATURE_FILE);
      if (existsSync(signaturePath)) {
        return { path: searchRoot, volumeName: searchRoot };
      }
    } else {
      // On macOS/Linux, enumerate subdirectories under the search root
      let entries: string[];
      try {
        entries = readdirSync(searchRoot);
      } catch {
        continue;
      }

      for (const entry of entries) {
        const volumePath = join(searchRoot, entry);
        const signaturePath = join(volumePath, DEVICE_SIGNATURE_FILE);
        if (existsSync(signaturePath)) {
          return { path: volumePath, volumeName: entry };
        }
      }
    }
  }

  return null;
}
