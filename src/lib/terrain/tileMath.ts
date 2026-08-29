/** Web Mercator XYZ tile helpers (EPSG:3857 / slippy map) */

const TILE_SIZE = 256

export function lonToTileX(lon: number, z: number): number {
  const n = 2 ** z
  return Math.floor(((lon + 180) / 360) * n)
}

export function latToTileY(lat: number, z: number): number {
  const n = 2 ** z
  const rad = (lat * Math.PI) / 180
  const y =
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  return Math.floor(y)
}

export function tileXToLon(x: number, z: number): number {
  const n = 2 ** z
  return (x / n) * 360 - 180
}

export function tileYToLat(y: number, z: number): number {
  const n = 2 ** z
  const rad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)))
  return (rad * 180) / Math.PI
}

export function lonLatToTilePixel(
  lon: number,
  lat: number,
  z: number,
): { tileX: number; tileY: number; px: number; py: number } {
  const n = 2 ** z
  const x = ((lon + 180) / 360) * n
  const rad = (lat * Math.PI) / 180
  const y =
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  const tileX = Math.floor(x)
  const tileY = Math.floor(y)
  const px = (x - tileX) * TILE_SIZE
  const py = (y - tileY) * TILE_SIZE
  return { tileX, tileY, px, py }
}

export function tilesForBBox(
  west: number,
  south: number,
  east: number,
  north: number,
  z: number,
): { z: number; x: number; y: number }[] {
  const x0 = lonToTileX(west, z)
  const x1 = lonToTileX(east, z)
  const y0 = latToTileY(north, z)
  const y1 = latToTileY(south, z)
  const tiles: { z: number; x: number; y: number }[] = []
  const max = 2 ** z - 1
  for (let x = Math.max(0, x0); x <= Math.min(max, x1); x++) {
    for (let y = Math.max(0, y0); y <= Math.min(max, y1); y++) {
      tiles.push({ z, x, y })
    }
  }
  return tiles
}

/** Choose Terrarium zoom with enough detail for ~16 m sampling */
export function chooseSourceZoom(
  regionMeters: number,
  outputPx: number,
): number {
  // Aim for source resolution roughly at or finer than 16 m.
  // At equator, zoom z has ~156543 / 2^z meters per pixel.
  const targetMpp = regionMeters / Math.max(1, outputPx - 1)
  let z = 0
  for (let candidate = 0; candidate <= 15; candidate++) {
    const mpp = 156543.03392804097 / 2 ** candidate
    z = candidate
    if (mpp <= targetMpp) break
  }
  // Cap to avoid huge tile counts for large regions
  return Math.min(14, Math.max(10, z))
}
