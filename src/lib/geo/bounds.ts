import type { MetricBounds } from '../../types/terrain'
import type { LocalProjection } from './projection'

export function expandBoundsLatLon(
  bounds: MetricBounds,
  projection: LocalProjection,
): { west: number; south: number; east: number; north: number } {
  const corners: [number, number][] = [
    [bounds.minX, bounds.minY],
    [bounds.maxX, bounds.minY],
    [bounds.maxX, bounds.maxY],
    [bounds.minX, bounds.maxY],
  ]
  let west = Infinity
  let east = -Infinity
  let south = Infinity
  let north = -Infinity
  for (const [x, y] of corners) {
    const { lon, lat } = projection.inverse(x, y)
    west = Math.min(west, lon)
    east = Math.max(east, lon)
    south = Math.min(south, lat)
    north = Math.max(north, lat)
  }
  return { west, south, east, north }
}
