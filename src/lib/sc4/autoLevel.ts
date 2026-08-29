/**
 * Suggest SC4 water-plane / scale from a region DEM.
 *
 * Why “region minimum” fails: the absolute min is often a single pit or DEM
 * artifact below the river. Almost no pixels are ≤ that plane → all green.
 * Rivers/coasts are low *bands* (many samples), better captured by a low
 * percentile or a histogram mode in the lower elevation range.
 */

export interface ElevationStats {
  count: number
  min: number
  max: number
  p05: number
  p10: number
  p50: number
  p95: number
  /** Share of samples at or below 2 m AMSL (coastal signal). */
  fractionNearSea: number
}

export interface AutoLevelSuggestion {
  waterPlaneMeters: number
  verticalScale: number
  waterDepthMeters: number
  coastal: boolean
  stats: ElevationStats
  reason: string
}

const DEFAULT_DEEPEN = 15
/** Inland: boost flat relief so p95 sits ~this many meters above the plane. */
const TARGET_INLAND_RELIEF_M = 70
const COASTAL_SEA_FRACTION = 0.015
const COASTAL_P05_MAX_M = 2

function percentileSorted(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const t = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(t)
  const hi = Math.ceil(t)
  if (lo === hi) return sorted[lo]!
  const f = t - lo
  return sorted[lo]! * (1 - f) + sorted[hi]! * f
}

function collectFinite(
  elevations: Float32Array,
  isNodata?: (m: number) => boolean,
): number[] {
  const out: number[] = []
  for (let i = 0; i < elevations.length; i++) {
    const m = elevations[i]!
    if (!Number.isFinite(m)) continue
    if (isNodata?.(m)) continue
    out.push(m)
  }
  return out
}

/**
 * Dominant elevation bin in [lo, hi] — catches flat river/floodplain surfaces.
 */
export function elevationModeMeters(
  samples: number[],
  lo: number,
  hi: number,
  binMeters = 2,
): number | null {
  if (!(hi > lo) || samples.length === 0) return null
  const nBins = Math.max(1, Math.ceil((hi - lo) / binMeters))
  const counts = new Array<number>(nBins).fill(0)
  let total = 0
  for (const m of samples) {
    if (m < lo || m > hi) continue
    const b = Math.min(nBins - 1, Math.floor((m - lo) / binMeters))
    counts[b]!++
    total++
  }
  if (total < 80) return null
  let best = 0
  for (let i = 1; i < nBins; i++) {
    if (counts[i]! > counts[best]!) best = i
  }
  if (counts[best]! / total < 0.04) return null
  return lo + (best + 0.5) * binMeters
}

export function computeElevationStats(
  elevations: Float32Array,
  isNodata?: (m: number) => boolean,
): ElevationStats | null {
  const samples = collectFinite(elevations, isNodata)
  if (samples.length === 0) return null
  samples.sort((a, b) => a - b)
  let nearSea = 0
  for (const m of samples) {
    if (m <= 2) nearSea++
  }
  return {
    count: samples.length,
    min: samples[0]!,
    max: samples[samples.length - 1]!,
    p05: percentileSorted(samples, 5),
    p10: percentileSorted(samples, 10),
    p50: percentileSorted(samples, 50),
    p95: percentileSorted(samples, 95),
    fractionNearSea: nearSea / samples.length,
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step
}

/**
 * Derive water plane, deepen, and vertical scale from region elevations.
 */
export function suggestAutoLevel(
  elevations: Float32Array,
  options?: { isNodata?: (m: number) => boolean },
): AutoLevelSuggestion {
  const samples = collectFinite(elevations, options?.isNodata)
  const emptyStats: ElevationStats = {
    count: 0,
    min: 0,
    max: 0,
    p05: 0,
    p10: 0,
    p50: 0,
    p95: 0,
    fractionNearSea: 0,
  }

  if (samples.length === 0) {
    return {
      waterPlaneMeters: 0,
      verticalScale: 1,
      waterDepthMeters: DEFAULT_DEEPEN,
      coastal: true,
      stats: emptyStats,
      reason: 'No elevation samples — using coastal defaults',
    }
  }

  samples.sort((a, b) => a - b)
  const stats = computeElevationStats(elevations, options?.isNodata)!

  if (
    stats.fractionNearSea >= COASTAL_SEA_FRACTION ||
    stats.p05 <= COASTAL_P05_MAX_M
  ) {
    return {
      waterPlaneMeters: 0,
      verticalScale: 1,
      waterDepthMeters: DEFAULT_DEEPEN,
      coastal: true,
      stats,
      reason: `Coastal (≈${(stats.fractionNearSea * 100).toFixed(1)}% ≤2 m, p05=${stats.p05.toFixed(1)} m)`,
    }
  }

  // Inland: prefer flat low mode (river), else ~8th percentile — not absolute min.
  const modeHi = Math.min(
    stats.p50,
    stats.p05 + Math.max(20, (stats.p50 - stats.p05) * 0.6),
  )
  const mode = elevationModeMeters(samples, stats.min, modeHi, 2)
  const percentilePlane = percentileSorted(samples, 8)
  let waterPlane = mode ?? percentilePlane

  // Keep plane below typical land so the city is not flooded.
  waterPlane = Math.min(waterPlane, stats.p50 - 3)
  waterPlane = Math.max(waterPlane, stats.min)
  waterPlane = roundTo(waterPlane, 1)

  const relief = Math.max(1, stats.p95 - waterPlane)
  let verticalScale = 1
  if (relief < TARGET_INLAND_RELIEF_M) {
    verticalScale = clamp(TARGET_INLAND_RELIEF_M / relief, 1, 1.6)
  }
  verticalScale = roundTo(verticalScale, 0.05)

  const reason =
    mode != null
      ? `Inland water band ~${waterPlane} m (mode), relief ${relief.toFixed(0)} m → scale ${verticalScale.toFixed(2)}×`
      : `Inland low percentile ~${waterPlane} m, relief ${relief.toFixed(0)} m → scale ${verticalScale.toFixed(2)}×`

  return {
    waterPlaneMeters: waterPlane,
    verticalScale,
    waterDepthMeters: DEFAULT_DEEPEN,
    coastal: false,
    stats,
    reason,
  }
}
