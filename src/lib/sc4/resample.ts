import { expandBoundsLatLon } from '../geo/bounds'
import { metricBoundsAroundCenter } from '../geo/projection'
import type { LatLon } from '../../types/terrain'
import { describeRegion, sampleGridPositions } from './region'
import { getTerrainSource } from '../terrain/terrainSource'
import { chooseSourceZoom, tilesForBBox } from '../terrain/tileMath'
import {
  fetchTerrainTile,
  mapPool,
  TileCache,
} from '../terrain/tileCache'
import { sampleElevationAtLonLatSync } from '../terrain/sampleTerrain'
import type { DecodedTerrainTile } from '../../types/terrain'

export interface ResampleProgress {
  stage: 'fetching' | 'decoding' | 'resampling'
  progress: number
}

/**
 * Build exact 16 m SC4 elevation grid (meters) for a region centered on lat/lon.
 */
export async function resampleRegionToSc4Grid(
  center: LatLon,
  largeTilesX: number,
  largeTilesY: number,
  options?: {
    sourceZoom?: number
    concurrency?: number
    onProgress?: (p: ResampleProgress) => void
  },
): Promise<{ width: number; height: number; elevations: Float32Array }> {
  const region = describeRegion(largeTilesX, largeTilesY)
  const { projection, bounds } = metricBoundsAroundCenter(
    center,
    region.widthMeters,
    region.heightMeters,
  )
  const bbox = expandBoundsLatLon(bounds, projection)
  const sourceZoom =
    options?.sourceZoom ??
    chooseSourceZoom(
      Math.max(region.widthMeters, region.heightMeters),
      Math.max(region.widthPx, region.heightPx),
    )
  const tileCoords = tilesForBBox(
    bbox.west,
    bbox.south,
    bbox.east,
    bbox.north,
    sourceZoom,
  )
  if (tileCoords.length === 0) {
    throw new Error('No terrain tiles intersect the selected region')
  }

  const source = getTerrainSource()
  const cache = new TileCache()
  const concurrency = options?.concurrency ?? 6
  options?.onProgress?.({ stage: 'fetching', progress: 0 })

  const tiles = await mapPool(
    tileCoords,
    concurrency,
    async (t) => fetchTerrainTile(source, t.z, t.x, t.y, cache),
    (done, total) => {
      options?.onProgress?.({
        stage: 'fetching',
        progress: done / total,
      })
    },
  )

  options?.onProgress?.({ stage: 'decoding', progress: 1 })

  const tileIndex = new Map<string, DecodedTerrainTile>()
  for (const tile of tiles) {
    tileIndex.set(`${tile.z}/${tile.x}/${tile.y}`, tile)
  }

  const { xs, ys } = sampleGridPositions(
    bounds.minX,
    bounds.minY,
    region.widthPx,
    region.heightPx,
  )

  const elevations = new Float32Array(region.widthPx * region.heightPx)
  const total = elevations.length
  let completed = 0
  const reportEvery = Math.max(1, Math.floor(total / 100))

  // Row 0 = south (minY), increasing north — PNG row 0 is top (north).
  for (let row = 0; row < region.heightPx; row++) {
    const y = ys[row]!
    // PNG row 0 is top = north = last metric row
    const pngRow = region.heightPx - 1 - row
    for (let col = 0; col < region.widthPx; col++) {
      const x = xs[col]!
      const { lon, lat } = projection.inverse(x, y)
      const meters = sampleElevationAtLonLatSync(lon, lat, sourceZoom, tileIndex)
      elevations[pngRow * region.widthPx + col] = meters
      completed++
      if (completed % reportEvery === 0) {
        options?.onProgress?.({
          stage: 'resampling',
          progress: completed / total,
        })
      }
    }
  }
  options?.onProgress?.({ stage: 'resampling', progress: 1 })

  return {
    width: region.widthPx,
    height: region.heightPx,
    elevations,
  }
}

/**
 * Coarse elevation sample across the full region (for auto-level suggestions).
 * Much cheaper than the exact 16 m SC4 grid.
 */
export async function sampleRegionElevationsCoarse(
  center: LatLon,
  largeTilesX: number,
  largeTilesY: number,
  options?: {
    /** Samples per axis (default 129). */
    samplesPerAxis?: number
    sourceZoom?: number
    concurrency?: number
    onProgress?: (p: ResampleProgress) => void
  },
): Promise<Float32Array> {
  const region = describeRegion(largeTilesX, largeTilesY)
  const { projection, bounds } = metricBoundsAroundCenter(
    center,
    region.widthMeters,
    region.heightMeters,
  )
  const bbox = expandBoundsLatLon(bounds, projection)
  const n = Math.max(17, options?.samplesPerAxis ?? 129)
  const sourceZoom =
    options?.sourceZoom ??
    chooseSourceZoom(
      Math.max(region.widthMeters, region.heightMeters),
      n,
    )
  const tileCoords = tilesForBBox(
    bbox.west,
    bbox.south,
    bbox.east,
    bbox.north,
    sourceZoom,
  )
  if (tileCoords.length === 0) {
    throw new Error('No terrain tiles intersect the selected region')
  }

  const source = getTerrainSource()
  const cache = new TileCache()
  const concurrency = options?.concurrency ?? 6
  options?.onProgress?.({ stage: 'fetching', progress: 0 })

  const tiles = await mapPool(
    tileCoords,
    concurrency,
    async (t) => fetchTerrainTile(source, t.z, t.x, t.y, cache),
    (done, total) => {
      options?.onProgress?.({
        stage: 'fetching',
        progress: done / total,
      })
    },
  )

  options?.onProgress?.({ stage: 'decoding', progress: 1 })

  const tileIndex = new Map<string, DecodedTerrainTile>()
  for (const tile of tiles) {
    tileIndex.set(`${tile.z}/${tile.x}/${tile.y}`, tile)
  }

  const elevations = new Float32Array(n * n)
  const total = elevations.length
  let completed = 0
  const reportEvery = Math.max(1, Math.floor(total / 50))
  const { minX, minY, maxX, maxY } = bounds

  for (let row = 0; row < n; row++) {
    const ty = n === 1 ? 0.5 : row / (n - 1)
    const y = minY + ty * (maxY - minY)
    for (let col = 0; col < n; col++) {
      const tx = n === 1 ? 0.5 : col / (n - 1)
      const x = minX + tx * (maxX - minX)
      const { lon, lat } = projection.inverse(x, y)
      elevations[row * n + col] = sampleElevationAtLonLatSync(
        lon,
        lat,
        sourceZoom,
        tileIndex,
      )
      completed++
      if (completed % reportEvery === 0) {
        options?.onProgress?.({
          stage: 'resampling',
          progress: completed / total,
        })
      }
    }
  }
  options?.onProgress?.({ stage: 'resampling', progress: 1 })
  return elevations
}
