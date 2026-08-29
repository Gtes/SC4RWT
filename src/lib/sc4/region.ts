import {
  SC4_LARGE_CITY_CELLS,
  SC4_METERS_PER_CELL,
} from './constants'

/** Output PNG size for N large cities along one axis: N×256+1 */
export function outputSizeForLargeTiles(largeTiles: number): number {
  if (!Number.isInteger(largeTiles) || largeTiles < 1) {
    throw new Error(`largeTiles must be a positive integer, got ${largeTiles}`)
  }
  return largeTiles * SC4_LARGE_CITY_CELLS + 1
}

/** Real-world meters spanned by N large cities (edge length) */
export function regionMetersForLargeTiles(largeTiles: number): number {
  return largeTiles * SC4_LARGE_CITY_CELLS * SC4_METERS_PER_CELL
}

export interface RegionSpec {
  largeTilesX: number
  largeTilesY: number
  widthPx: number
  heightPx: number
  widthMeters: number
  heightMeters: number
}

export function describeRegion(
  largeTilesX: number,
  largeTilesY: number,
): RegionSpec {
  return {
    largeTilesX,
    largeTilesY,
    widthPx: outputSizeForLargeTiles(largeTilesX),
    heightPx: outputSizeForLargeTiles(largeTilesY),
    widthMeters: regionMetersForLargeTiles(largeTilesX),
    heightMeters: regionMetersForLargeTiles(largeTilesY),
  }
}

/**
 * Sample positions in local metric CRS.
 * `widthPx` samples span `(widthPx - 1)` intervals of 16 m.
 * Origin is SW corner; +X east, +Y north.
 */
export function sampleGridPositions(
  minX: number,
  minY: number,
  widthPx: number,
  heightPx: number,
): { xs: Float64Array; ys: Float64Array } {
  const xs = new Float64Array(widthPx)
  const ys = new Float64Array(heightPx)
  for (let i = 0; i < widthPx; i++) {
    xs[i] = minX + i * SC4_METERS_PER_CELL
  }
  for (let j = 0; j < heightPx; j++) {
    ys[j] = minY + j * SC4_METERS_PER_CELL
  }
  return { xs, ys }
}
