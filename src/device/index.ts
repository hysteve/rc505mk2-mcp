/**
 * Device detection and upload module for the RC-505mk2.
 */

export { DEVICE_SIGNATURE_PATH, DEVICE_SIGNATURE_FILE, DEVICE_DATA_DIR, getVolumeSearchPaths } from './constants.js';
export { detectDevice } from './detect.js';
export type { DeviceInfo } from './detect.js';
export { uploadToDevice, checkDeviceSlot } from './upload.js';
export type { UploadResult, UploadOptions } from './upload.js';
export { ejectDevice } from './eject.js';
export type { EjectResult } from './eject.js';
export { readDeviceSlot, listDeviceSlots } from './read.js';
export type { DeviceSlotSummary, ReadDeviceSlotResult } from './read.js';
