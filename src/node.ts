/**
 * Node.js-specific exports for @rc505mk2/lib.
 * Contains device detection, upload, and file-based storage that requires fs/os.
 *
 * Import from '@rc505mk2/lib/node'.
 */

export { detectDevice, uploadToDevice, checkDeviceSlot } from './device/index.js';
export type { DeviceInfo, UploadResult, UploadOptions } from './device/index.js';
export { DEVICE_DATA_DIR, DEVICE_SIGNATURE_PATH, getVolumeSearchPaths } from './device/index.js';

export { FxModuleStore } from './mcp/fx-module-store.js';
export { PresetStore } from './stores/preset-store.js';
export { findPackageRoot, resolveBundledDataDir, resolveBundledFxModulesDir, resolveUserDataDir } from './stores/paths.js';
export type {
  FxModuleFilters,
  FxModuleSummary,
  RackFilters,
  RackSummary,
  MemoryConfigFilters,
} from './stores/preset-store.js';
