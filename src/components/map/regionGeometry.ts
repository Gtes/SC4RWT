import { createLocalProjection, metricBoundsAroundCenter } from '../../lib/geo/projection'
import { describeRegion } from '../../lib/sc4/region'
import type { LatLon } from '../../types/terrain'

export interface RegionGeometry {
  /** Exterior ring [lon, lat][] closed */
  outline: [number, number][]
  /** Interior grid lines as LineString coordinates */
  gridLines: [number, number][][]
  widthMeters: number
  heightMeters: number
  widthPx: number
  heightPx: number
}

function edgePoints(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  segments: number,
  inverse: (x: number, y: number) => LatLon,
): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const { lon, lat } = inverse(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)
    pts.push([lon, lat])
  }
  return pts
}

/**
 * Build overlay geometry in WGS84 for an SC4 region of exact metric size.
 * Physical size does not depend on map zoom.
 */
export function buildRegionGeometry(
  center: LatLon,
  largeTilesX: number,
  largeTilesY: number,
): RegionGeometry {
  const region = describeRegion(largeTilesX, largeTilesY)
  const { projection, bounds } = metricBoundsAroundCenter(
    center,
    region.widthMeters,
    region.heightMeters,
  )
  const { minX, maxX, minY, maxY } = bounds
  const inv = projection.inverse
  const segs = 16

  const south = edgePoints(minX, minY, maxX, minY, segs, inv)
  const east = edgePoints(maxX, minY, maxX, maxY, segs, inv).slice(1)
  const north = edgePoints(maxX, maxY, minX, maxY, segs, inv).slice(1)
  const west = edgePoints(minX, maxY, minX, minY, segs, inv).slice(1)
  const outline = [...south, ...east, ...north, ...west]

  const gridLines: [number, number][][] = []
  // Vertical lines between large city tiles (and outer already in outline)
  for (let i = 1; i < largeTilesX; i++) {
    const x = minX + (i / largeTilesX) * region.widthMeters
    gridLines.push(edgePoints(x, minY, x, maxY, segs, inv))
  }
  for (let j = 1; j < largeTilesY; j++) {
    const y = minY + (j / largeTilesY) * region.heightMeters
    gridLines.push(edgePoints(minX, y, maxX, y, segs, inv))
  }

  return {
    outline,
    gridLines,
    widthMeters: region.widthMeters,
    heightMeters: region.heightMeters,
    widthPx: region.widthPx,
    heightPx: region.heightPx,
  }
}

export function createProjectionForCenter(center: LatLon) {
  return createLocalProjection(center)
}
