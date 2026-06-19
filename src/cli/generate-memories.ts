/**
 * CLI: Generate RC0 memory files from JSON config.
 *
 * Usage:
 *   rc505mk2 generate <config.json> [--slot <n>] [--output <dir>] [--upload] [--device <path>]
 *   rc505mk2 upload <slot|file> [--device <path>] [--backup-dir <dir>] [--no-backup]
 *   rc505mk2 detect
 *   rc505mk2 list-fx [--context ifx|tfx]
 *   rc505mk2 lookup-fx <name>
 *   cat config.json | rc505mk2 generate --slot 50
 */

import { readFileSync, readSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { getDefaultTemplate } from '../template/template-loader.js';
import { memoryConfigToRc0Pair } from '../generator/rc0-generator.js';
import { formatSlotNumber } from '../download/rc0-download.js';
import { RC0_FX_NAME_LIST } from '../fx/fx-names.js';
import { PARAM_MAP } from '../params/param-map.js';
import { detectDevice } from '../device/detect.js';
import { uploadToDevice, checkDeviceSlot } from '../device/upload.js';
import { DEVICE_DATA_DIR } from '../device/constants.js';
import type { MemoryConfig } from '../types/memory-config.js';
import { doctorCommand } from './doctor.js';

function printUsage() {
  console.log(`
rc505mk2 - RC-505mk2 Memory File Generator

Commands:
  generate <config.json>     Generate RC0 files from a MemoryConfig JSON file
  upload <slot>              Upload generated files for a slot to the connected device
  detect                     Detect a connected RC-505mk2 device
  doctor                     Verify install paths, bundled data, and device
  list-fx                    List all available FX types
  lookup-fx <name>           Show parameters for an FX type

Options (generate):
  --slot <n>        Memory slot number (1-99, default: from config or 1)
  --output <dir>    Output directory (default: ./output)
  --upload          Auto-upload to device after generating

Options (upload / generate --upload):
  --device <path>   Explicit device mount path (skips auto-detection)
  --backup-dir <d>  Backup directory (default: ./rc505-backups)
  --no-backup       Skip backing up existing files on device
  --yes             Skip overwrite confirmation

General:
  --help            Show this help message
`);
}

function listFx() {
  console.log('Available FX types:\n');
  for (const name of RC0_FX_NAME_LIST) {
    const params = PARAM_MAP[name];
    const paramNames = params ? Object.keys(params).join(', ') : '(no params)';
    console.log(`  ${name}`);
    console.log(`    Params: ${paramNames}\n`);
  }
}

function lookupFx(name: string) {
  const params = PARAM_MAP[name.toUpperCase()];
  if (!params) {
    console.error(`Unknown FX type: ${name}`);
    process.exit(1);
  }
  console.log(`\n${name.toUpperCase()} Parameters:\n`);
  for (const [paramName, def] of Object.entries(params)) {
    console.log(`  ${paramName} (tag: ${def.tag})`);
  }
}

interface CliFlags {
  slot?: number;
  output: string;
  upload: boolean;
  device?: string;
  backupDir: string;
  noBackup: boolean;
  yes: boolean;
}

function parseFlags(args: string[], startIndex: number): CliFlags {
  const flags: CliFlags = {
    output: './output',
    upload: false,
    backupDir: './rc505-backups',
    noBackup: false,
    yes: false,
  };

  for (let i = startIndex; i < args.length; i++) {
    switch (args[i]) {
      case '--slot':
        flags.slot = parseInt(args[++i], 10);
        break;
      case '--output':
        flags.output = args[++i];
        break;
      case '--upload':
        flags.upload = true;
        break;
      case '--device':
        flags.device = args[++i];
        break;
      case '--backup-dir':
        flags.backupDir = args[++i];
        break;
      case '--no-backup':
        flags.noBackup = true;
        break;
      case '--yes':
      case '-y':
        flags.yes = true;
        break;
    }
  }

  return flags;
}

function generate(configPath: string, flags: CliFlags) {
  let configJson: string;

  if (configPath === '-') {
    configJson = readFileSync(0, 'utf-8');
  } else {
    configJson = readFileSync(resolve(configPath), 'utf-8');
  }

  const config: MemoryConfig = JSON.parse(configJson);
  if (flags.slot !== undefined) {
    config.slotNumber = flags.slot;
  }

  const template = getDefaultTemplate();
  const { xmlA, xmlB } = memoryConfigToRc0Pair(template, config);
  const slot = formatSlotNumber(config.slotNumber);

  mkdirSync(flags.output, { recursive: true });

  const fileA = resolve(flags.output, `MEMORY${slot}A.RC0`);
  const fileB = resolve(flags.output, `MEMORY${slot}B.RC0`);

  writeFileSync(fileA, xmlA, 'utf-8');
  writeFileSync(fileB, xmlB, 'utf-8');

  console.log(`Generated:`);
  console.log(`  ${fileA}`);
  console.log(`  ${fileB}`);

  if (flags.upload) {
    console.log('');
    doUpload(xmlA, xmlB, config.slotNumber, flags);
  }
}

function doUpload(xmlA: string, xmlB: string, slotNumber: number, flags: CliFlags) {
  // Check for device
  const device = flags.device
    ? { path: flags.device, volumeName: flags.device }
    : detectDevice();

  if (!device) {
    console.error(
      'Error: RC-505mk2 not detected.\n' +
      'Connect the device via USB, enable Storage mode (MENU > USB > STORAGE > CONNECT),\n' +
      'and try again. Or specify the path with --device.',
    );
    process.exit(1);
  }

  console.log(`Device found: ${device.volumeName} (${device.path})`);

  // Check for existing files and warn
  const dataPath = join(device.path, DEVICE_DATA_DIR);
  const slotInfo = checkDeviceSlot(dataPath, slotNumber);

  if (slotInfo.exists && !flags.yes) {
    console.log(`\nWarning: ${slotInfo.slotLabel} already exists on device.`);
    console.log(`  ${slotInfo.fileA}`);
    console.log(`  ${slotInfo.fileB}`);
    console.log(`\nExisting files will be backed up before overwriting.`);
    console.log(`Use --yes to skip this confirmation in the future.\n`);

    // Synchronous stdin confirmation
    const buf = Buffer.alloc(3);
    process.stdout.write('Overwrite? (y/N) ');
    const bytesRead = readSync(0, buf);
    const answer = buf.toString('utf-8', 0, bytesRead).trim().toLowerCase();
    if (answer !== 'y' && answer !== 'yes') {
      console.log('Aborted.');
      process.exit(0);
    }
  }

  const result = uploadToDevice(xmlA, xmlB, slotNumber, {
    devicePath: flags.device,
    backupDir: flags.backupDir,
    skipBackup: flags.noBackup,
  });

  if (result.backedUp) {
    console.log(`Backed up existing files:`);
    if (result.backedUp.fileA) console.log(`  ${result.backedUp.fileA}`);
    if (result.backedUp.fileB) console.log(`  ${result.backedUp.fileB}`);
  }

  console.log(`Uploaded to device:`);
  console.log(`  ${result.uploaded.fileA}`);
  console.log(`  ${result.uploaded.fileB}`);
}

function uploadCommand(slotArg: string, flags: CliFlags) {
  const slotNumber = parseInt(slotArg, 10);
  if (isNaN(slotNumber) || slotNumber < 1 || slotNumber > 99) {
    console.error('Error: slot must be a number between 1 and 99.');
    process.exit(1);
  }

  // Read from the output directory
  const slot = formatSlotNumber(slotNumber);
  const fileA = resolve(flags.output, `MEMORY${slot}A.RC0`);
  const fileB = resolve(flags.output, `MEMORY${slot}B.RC0`);

  if (!existsSync(fileA) || !existsSync(fileB)) {
    console.error(`Error: Generated files not found for slot ${slotNumber}.`);
    console.error(`Expected: ${fileA}`);
    console.error(`Expected: ${fileB}`);
    console.error(`\nRun 'rc505mk2 generate <config.json> --slot ${slotNumber}' first.`);
    process.exit(1);
  }

  const xmlA = readFileSync(fileA, 'utf-8');
  const xmlB = readFileSync(fileB, 'utf-8');

  doUpload(xmlA, xmlB, slotNumber, flags);
}

function detectCommand() {
  const device = detectDevice();
  if (device) {
    console.log(`RC-505mk2 detected:`);
    console.log(`  Volume: ${device.volumeName}`);
    console.log(`  Path:   ${device.path}`);
    console.log(`  Data:   ${join(device.path, DEVICE_DATA_DIR)}`);
  } else {
    console.log('RC-505mk2 not detected.');
    console.log('Connect the device via USB and enable Storage mode (MENU > USB > STORAGE > CONNECT).');
  }
}

// ── Main ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help') {
  printUsage();
  process.exit(0);
}

if (command === 'list-fx') {
  listFx();
} else if (command === 'lookup-fx') {
  lookupFx(args[1] ?? '');
} else if (command === 'detect') {
  detectCommand();
} else if (command === 'doctor') {
  process.exit(doctorCommand());
} else if (command === 'upload') {
  const slotArg = args[1];
  if (!slotArg) {
    console.error('Error: slot number required.');
    console.error('Usage: rc505mk2 upload <slot> [--device <path>]');
    process.exit(1);
  }
  const flags = parseFlags(args, 2);
  uploadCommand(slotArg, flags);
} else if (command === 'generate') {
  const configPath = args[1];
  if (!configPath) {
    console.error('Error: config file path required');
    printUsage();
    process.exit(1);
  }
  const flags = parseFlags(args, 2);
  generate(configPath, flags);
} else {
  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}
