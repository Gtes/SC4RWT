import type { DecodedTerrainTile, TerrainSource } from '../../types/terrain'
import { lonLatToTilePixel } from './tileMath'
import { fetchTerrainTile, type TileCache } from './tileCache'

function sampleTileBilinear(
  tile: DecodedTerrainTile,
  px: number,
  py: number,
): number {
  const { width, height, elevations } = tile
  const x0 = Math.floor(px)
  const y0 = Math.floor(py)
  const x1 = Math.min(width - 1, x0 + 1)
  const y1 = Math.min(height - 1, y0 + 1)
  const fx = px - x0
  const fy = py - y0
  const clampX0 = Math.max(0, Math.min(width - 1, x0))
  const clampY0 = Math.max(0, Math.min(height - 1, y0))
  const a = elevations[clampY0 * width + clampX0]!
  const b = elevations[clampY0 * width + x1]!
  const c = elevations[y1 * width + clampX0]!
  const d = elevations[y1 * width + x1]!
  const top = a * (1 - fx) + b * fx
  const bot = c * (1 - fx) + d * fx
  return top * (1 - fy) + bot * fy
}

export async function sampleElevationAtLonLat(
  lon: number,
  lat: number,
  z: number,
  source: TerrainSource,
  cache: TileCache,
  tileIndex?: Map<string, DecodedTerrainTile>,
): Promise<number> {
  const { tileX, tileY, px, py } = lonLatToTilePixel(lon, lat, z)
  const key = `${z}/${tileX}/${tileY}`
  let tile = tileIndex?.get(key) ?? cache.get(z, tileX, tileY)
  if (!tile) {
    tile = await fetchTerrainTile(source, z, tileX, tileY, cache)
    tileIndex?.set(key, tile)
  }
  return sampleTileBilinear(tile, px, py)
}

export function sampleElevationAtLonLatSync(
  lon: number,
  lat: number,
  z: number,
  tileIndex: Map<string, DecodedTerrainTile>,
): number {
  const { tileX, tileY, px, py } = lonLatToTilePixel(lon, lat, z)
  const key = `${z}/${tileX}/${tileY}`
  const tile = tileIndex.get(key)
  if (!tile) {
    throw new Error(`Missing terrain tile ${key}`)
  }
  // Handle sample near eastern/southern tile edge by preferring current tile
  return sampleTileBilinear(tile, Math.min(px, tile.width - 1.001), Math.min(py, tile.height - 1.001))
}

/** Pure bilinear helper for unit tests */
export function bilinear(
  a: number,
  b: number,
  c: number,
  d: number,
  fx: number,
  fy: number,
): number {
  const top = a * (1 - fx) + b * fx
  const bot = c * (1 - fx) + d * fx
  return top * (1 - fy) + bot * fy
}
