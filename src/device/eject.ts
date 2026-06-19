/**
 * Eject (unmount) an RC-505mk2 device after upload.
 *
 * macOS:  diskutil eject <path>
 * Linux:  udisksctl unmount -b <device> || umount <path>
 * Win32:  not yet supported (requires external tooling)
 */

import { execSync } from 'node:child_process';
import { platform } from 'node:os';

export interface EjectResult {
  ejected: boolean;
  message: string;
}

/**
 * Eject the volume at the given mount path.
 * Returns a result indicating success/failure with a human-readable message.
 */
export function ejectDevice(mountPath: string): EjectResult {
  const os = platform();

  try {
    switch (os) {
      case 'darwin': {
        // Resolve the whole-disk identifier (e.g. "disk4") so we can
        // unmount ALL volumes on the physical device, then eject it.
        const info = execSync(`diskutil info ${JSON.stringify(mountPath)}`, {
          timeout: 10_000,
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        const diskMatch = info.match(/Part of Whole:\s+(\S+)/);

        if (diskMatch) {
          const diskId = diskMatch[1];
          execSync(`diskutil unmountDisk ${diskId}`, { timeout: 10_000, stdio: 'pipe' });
          execSync(`diskutil eject ${diskId}`, { timeout: 10_000, stdio: 'pipe' });
        } else {
          // Fallback: single-volume eject
          execSync(`diskutil eject ${JSON.stringify(mountPath)}`, { timeout: 10_000, stdio: 'pipe' });
        }

        return { ejected: true, message: `Device fully ejected (${mountPath}). Safe to disconnect.` };
      }

      case 'linux': {
        // Try udisksctl first (desktop), fall back to umount
        try {
          execSync(`udisksctl unmount -p ${JSON.stringify(mountPath)}`, {
            timeout: 10_000,
            stdio: 'pipe',
          });
        } catch {
          execSync(`umount ${JSON.stringify(mountPath)}`, {
            timeout: 10_000,
            stdio: 'pipe',
          });
        }
        return { ejected: true, message: `Device unmounted (${mountPath}).` };
      }

      default:
        return {
          ejected: false,
          message: `Auto-eject is not supported on ${os}. Please safely eject the device manually.`,
        };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ejected: false,
      message: `Failed to eject device: ${msg}. Please eject manually.`,
    };
  }
}
