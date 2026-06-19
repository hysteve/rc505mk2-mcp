/**
 * RC-505mk2 FX index maps — context-aware resolution.
 *
 * FX indices are context-dependent: some FX have different numeric indices
 * in Input FX (ifx) vs Track FX (tfx) sections. TAPE_ECHO_V505V2 and ROLL
 * have different indices in each context, and special Track FX (BEAT_SCATTER,
 * BEAT_REPEAT, BEAT_SHIFT, VINYL_FLICK) only exist in TFX.
 */

import type { FxContext } from './fx-names.js';

/**
 * Runtime-accessible FX index map — common FX types shared between IFX and TFX (0-48).
 * Values sourced from hands-on device research.
 */
export const FX_INDEX_COMMON: Record<string, number> = {
  LPF: 0,
  BPF: 1,
  HPF: 2,
  PHASER: 3,
  FLANGER: 4,
  SYNTH: 5,
  LOFI: 6,
  RADIO: 7,
  RING_MODULATOR: 8,
  G2B: 9,
  SUSTAINER: 10,
  AUTO_RIFF: 11,
  SLOW_GEAR: 12,
  TRANSPOSE: 13,
  PITCH_BEND: 14,
  ROBOT: 15,
  ELECTRIC: 16,
  HARMONIST_MANUAL: 17,
  HARMONIST_AUTO: 18,
  VOCODER: 19,
  OSC_VOCODER: 20,
  OSC_BOT: 21,
  PREAMP: 22,
  DIST: 23,
  DYNAMICS: 24,
  EQ: 25,
  ISOLATOR: 26,
  OCTAVE: 27,
  AUTO_PAN: 28,
  MANUAL_PAN: 29,
  STEREO_ENHANCE: 30,
  TREMOLO: 31,
  VIBRATO: 32,
  PATTERN_SLICER: 33,
  STEP_SLICER: 34,
  DELAY: 35,
  PANNING_DELAY: 36,
  REVERSE_DELAY: 37,
  MOD_DELAY: 38,
  TAPE_ECHO: 39,
  GRANULAR_DELAY: 40,
  WARP: 41,
  TWIST: 42,
  ROLL_V505V2: 43,     // ROLL 1 (old algorithm) — device verified at common index
  FREEZE: 44,
  CHORUS: 45,
  REVERB: 46,
  GATE_REVERB: 47,
  REVERSE_REVERB: 48,
};

/**
 * Input FX-specific index overrides (only under <ifx>).
 * TAPE_ECHO_V505V2 and ROLL get different indices in IFX context.
 */
export const FX_INDEX_IFX: Record<string, number> = {
  TAPE_ECHO_V505V2: 49, // TAPE ECHO 1 (ifx)
  ROLL: 50,             // ROLL 2 (new algorithm, ifx) — device verified
};

/**
 * Track FX-specific index overrides (only under <tfx>).
 * Special FX (49-52) + V505V2 variants (53-54).
 */
export const FX_INDEX_TFX: Record<string, number> = {
  BEAT_SCATTER: 49,
  BEAT_REPEAT: 50,
  BEAT_SHIFT: 51,
  VINYL_FLICK: 52,
  TAPE_ECHO_V505V2: 53, // TAPE ECHO 1 (tfx)
  ROLL: 54,             // ROLL 2 (new algorithm, tfx) — device verified
};

/**
 * Resolve the correct FX type index for a given FX name and context.
 * Context matters for TAPE_ECHO_V505V2, ROLL, and special TFX.
 */
export function resolveFxIndex(
  fxName: string,
  context: FxContext,
): number | undefined {
  const overrides = context === "ifx" ? FX_INDEX_IFX : FX_INDEX_TFX;
  if (fxName in overrides) return overrides[fxName];
  return FX_INDEX_COMMON[fxName];
}

/**
 * Reverse lookup: given a numeric index and context, return the FX name.
 * Used by the RC0 parser for reverse generation.
 */
export function fxNameFromIndex(
  index: number,
  context: FxContext,
): string | undefined {
  const overrides = context === "ifx" ? FX_INDEX_IFX : FX_INDEX_TFX;
  for (const [name, idx] of Object.entries(overrides)) {
    if (idx === index) return name;
  }
  for (const [name, idx] of Object.entries(FX_INDEX_COMMON)) {
    if (idx === index) return name;
  }
  return undefined;
}
