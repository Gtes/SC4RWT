import proj4 from 'proj4'
import type { LatLon, MetricBounds, MetricPoint } from '../../types/terrain'
import { describeUtm } from './utm'

const WGS84 = 'EPSG:4326'

export interface LocalProjection {
  epsg: string
  zone: number
  northern: boolean
  forward: (lon: number, lat: number) => MetricPoint
  inverse: (x: number, y: number) => LatLon
}

export function createLocalProjection(center: LatLon): LocalProjection {
  const { zone, northern, epsg } = describeUtm(center.lat, center.lon)
  const forward = (lon: number, lat: number): MetricPoint => {
    const [x, y] = proj4(WGS84, epsg, [lon, lat]) as [number, number]
    return { x, y }
  }
  const inverse = (x: number, y: number): LatLon => {
    const [lon, lat] = proj4(epsg, WGS84, [x, y]) as [number, number]
    return { lat, lon }
  }
  return { epsg, zone, northern, forward, inverse }
}

export function metricBoundsAroundCenter(
  center: LatLon,
  widthMeters: number,
  heightMeters: number,
  projection?: LocalProjection,
): { projection: LocalProjection; bounds: MetricBounds; centerMetric: MetricPoint } {
  const proj = projection ?? createLocalProjection(center)
  const c = proj.forward(center.lon, center.lat)
  const halfW = widthMeters / 2
  const halfH = heightMeters / 2
  return {
    projection: proj,
    centerMetric: c,
    bounds: {
      minX: c.x - halfW,
      maxX: c.x + halfW,
      minY: c.y - halfH,
      maxY: c.y + halfH,
    },
  }
}

/** Four corners + optional grid lines as lon/lat rings for map overlay */
export function boundsToLonLatRing(
  bounds: MetricBounds,
  projection: LocalProjection,
  segmentsPerEdge = 8,
): [number, number][] {
  const pts: [number, number][] = []
  const pushEdge = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    includeEnd: boolean,
  ) => {
    for (let i = 0; i < segmentsPerEdge; i++) {
      const t = i / segmentsPerEdge
      const x = x0 + (x1 - x0) * t
      const y = y0 + (y1 - y0) * t
      const { lon, lat } = projection.inverse(x, y)
      pts.push([lon, lat])
    }
    if (includeEnd) {
      const { lon, lat } = projection.inverse(x1, y1)
      pts.push([lon, lat])
    }
  }
  const { minX, maxX, minY, maxY } = bounds
  // SW → SE → NE → NW → SW
  pushEdge(minX, minY, maxX, minY, false)
  pushEdge(maxX, minY, maxX, maxY, false)
  pushEdge(maxX, maxY, minX, maxY, false)
  pushEdge(minX, maxY, minX, minY, true)
  return pts
}
