import { SC4_METERS_PER_CELL } from './constants'

export interface SyntheticBathymetryOptions {
  /** Real m AMSL treated as shore / sea level. */
  waterPlaneMeters: number
  /** Cap on carved depth below the water plane (m). */
  maxDepthMeters: number
  /** Distance (m) over which depth approaches ~63% of max (1−e⁻¹). */
  falloffMeters: number
  /** Grid cell size in meters (SC4 = 16). */
  cellSizeMeters?: number
  isNodata?: (m: number) => boolean
}

export const DEFAULT_SYNTH_BATHYMETRY = {
  maxDepthMeters: 80,
  falloffMeters: 2500,
} as const

/** True when this sample is water / ocean for shore-distance purposes. */
export const isWaterSample = (
  meters: number,
  waterPlaneMeters: number,
  isNodata?: (m: number) => boolean,
): boolean => {
  if (!Number.isFinite(meters)) return true
  if (isNodata?.(meters)) return true
  return meters <= waterPlaneMeters
}

/**
 * Multi-source BFS: cells of distance from nearest land.
 * Land seeds = elevation above the water plane. Water / nodata get ≥1 (or ∞ if no land).
 */
export const distanceToShoreCells = (
  elevations: Float32Array,
  width: number,
  height: number,
  waterPlaneMeters: number,
  isNodata?: (m: number) => boolean,
): Float32Array => {
  const n = width * height
  const dist = new Float32Array(n)
  dist.fill(Number.POSITIVE_INFINITY)
  const queue = new Int32Array(n)
  let head = 0
  let tail = 0

  for (let i = 0; i < n; i++) {
    if (!isWaterSample(elevations[i]!, waterPlaneMeters, isNodata)) {
      dist[i] = 0
      queue[tail++] = i
    }
  }

  while (head < tail) {
    const i = queue[head++]!
    const d = dist[i]!
    const x = i % width
    const y = (i / width) | 0
    const next = d + 1

    if (x > 0) {
      const ni = i - 1
      if (next < dist[ni]!) {
        dist[ni] = next
        queue[tail++] = ni
      }
    }
    if (x + 1 < width) {
      const ni = i + 1
      if (next < dist[ni]!) {
        dist[ni] = next
        queue[tail++] = ni
      }
    }
    if (y > 0) {
      const ni = i - width
      if (next < dist[ni]!) {
        dist[ni] = next
        queue[tail++] = ni
      }
    }
    if (y + 1 < height) {
      const ni = i + width
      if (next < dist[ni]!) {
        dist[ni] = next
        queue[tail++] = ni
      }
    }
  }

  return dist
}

/** Depth below plane from shore distance (asymptotic curve toward maxDepth). */
export const depthFromShoreMeters = (
  distanceCells: number,
  maxDepthMeters: number,
  falloffMeters: number,
  cellSizeMeters: number,
): number => {
  if (!(maxDepthMeters > 0) || !(falloffMeters > 0)) return 0
  if (!Number.isFinite(distanceCells) || distanceCells <= 0) {
    // No land in region → treat as open water at max depth.
    return Number.isFinite(distanceCells) ? 0 : maxDepthMeters
  }
  const distanceMeters = distanceCells * cellSizeMeters
  const depth =
    maxDepthMeters * (1 - Math.exp(-distanceMeters / falloffMeters))
  return Math.min(maxDepthMeters, Math.max(0, depth))
}

/**
 * Carve synthetic underwater depths from distance-to-shore.
 * Land above the plane is unchanged. Water / nodata become
 * `waterPlane - depth(distance)`.
 */
export const applySyntheticBathymetry = (
  elevations: Float32Array,
  width: number,
  height: number,
  options: SyntheticBathymetryOptions,
): Float32Array => {
  const {
    waterPlaneMeters,
    maxDepthMeters,
    falloffMeters,
    cellSizeMeters = SC4_METERS_PER_CELL,
    isNodata,
  } = options

  const dist = distanceToShoreCells(
    elevations,
    width,
    height,
    waterPlaneMeters,
    isNodata,
  )
  const out = new Float32Array(elevations.length)

  for (let i = 0; i < elevations.length; i++) {
    const m = elevations[i]!
    if (!isWaterSample(m, waterPlaneMeters, isNodata)) {
      out[i] = m
      continue
    }
    const depth = depthFromShoreMeters(
      dist[i]!,
      maxDepthMeters,
      falloffMeters,
      cellSizeMeters,
    )
    out[i] = waterPlaneMeters - depth
  }

  return out
}
