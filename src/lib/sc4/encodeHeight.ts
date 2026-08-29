import {
  SC4_HEIGHT_UNITS_PER_METER,
  SC4_OCEAN_FLOOR_METERS,
  SC4_SEA_LEVEL_METERS,
} from './constants'

export interface HeightEncodeOptions {
  /**
   * Real-world elevation (m AMSL) that maps to SC4 sea level (value 2500).
   * 0 = absolute ocean / MSL (coastal).
   * For inland cities (e.g. Kyiv ~95 m river), raise this so rivers become water.
   */
  waterPlaneMeters?: number
  /** Stretch relief around the water plane (1 = real). */
  verticalScale?: number
  /**
   * Extra meters to push elevations at/below the water plane deeper
   * (stronger water / darker blue in-game).
   */
  waterDepthMeters?: number
  oceanFloorMeters?: number
  treatAsOcean?: (realMeters: number) => boolean
}

/**
 * Convert real-world elevation (meters) to SC4 16-bit height value.
 * With defaults: sea level 0 m → ~250 m SC4 → value 2500.
 */
export function encodeHeightValue(
  realElevationMeters: number,
  options?: Pick<
    HeightEncodeOptions,
    'waterPlaneMeters' | 'verticalScale' | 'waterDepthMeters'
  >,
): number {
  const waterPlane = options?.waterPlaneMeters ?? 0
  const scale = options?.verticalScale ?? 1
  const deepen = options?.waterDepthMeters ?? 0

  let relative = (realElevationMeters - waterPlane) * scale
  if (relative <= 0 && deepen > 0) {
    relative -= deepen
  }
  const sc4Meters = relative + SC4_SEA_LEVEL_METERS
  const value = Math.round(sc4Meters * SC4_HEIGHT_UNITS_PER_METER)
  return Math.max(0, Math.min(65535, value))
}

export function encodeHeightGrid(
  elevationsMeters: Float32Array,
  options?: HeightEncodeOptions,
): Uint16Array {
  const oceanFloor = options?.oceanFloorMeters ?? SC4_OCEAN_FLOOR_METERS
  const treatAsOcean = options?.treatAsOcean
  const out = new Uint16Array(elevationsMeters.length)
  for (let i = 0; i < elevationsMeters.length; i++) {
    let m = elevationsMeters[i]!
    if (!Number.isFinite(m) || (treatAsOcean?.(m) ?? false)) {
      m = oceanFloor
    }
    out[i] = encodeHeightValue(m, options)
  }
  return out
}

/** Min finite elevation in a grid (for “region minimum” water plane). */
export function minElevationMeters(elevations: Float32Array): number {
  let min = Number.POSITIVE_INFINITY
  for (let i = 0; i < elevations.length; i++) {
    const m = elevations[i]!
    if (Number.isFinite(m) && m < min) min = m
  }
  if (!Number.isFinite(min)) return 0
  return min
}

/** Flat sea-level test: all zeros → constant 2500 */
export function flatSeaLevelGrid(width: number, height: number): Uint16Array {
  const value = encodeHeightValue(0)
  return new Uint16Array(width * height).fill(value)
}
