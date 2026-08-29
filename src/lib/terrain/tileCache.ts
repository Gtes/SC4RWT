import type { DecodedTerrainTile } from '../../types/terrain'
import type { TerrainSource } from '../../types/terrain'

export class TileCache {
  private cache = new Map<string, DecodedTerrainTile>()

  key(z: number, x: number, y: number): string {
    return `${z}/${x}/${y}`
  }

  get(z: number, x: number, y: number): DecodedTerrainTile | undefined {
    return this.cache.get(this.key(z, x, y))
  }

  set(tile: DecodedTerrainTile): void {
    this.cache.set(this.key(tile.z, tile.x, tile.y), tile)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}

async function decodeImageToElevations(
  blob: Blob,
  source: TerrainSource,
): Promise<{ width: number; height: number; elevations: Float32Array }> {
  // Prefer pure PNG decode (works in Worker and Node)
  try {
    const { decodePngToRgba } = await import('../png/decodePngRgba')
    const bytes = new Uint8Array(await blob.arrayBuffer())
    if (bytes[0] === 137 && bytes[1] === 80) {
      const { width, height, rgba } = decodePngToRgba(bytes)
      const elevations = new Float32Array(width * height)
      for (let i = 0, p = 0; i < elevations.length; i++, p += 4) {
        elevations[i] = source.decodePixel(rgba[p]!, rgba[p + 1]!, rgba[p + 2]!)
      }
      return { width, height, elevations }
    }
  } catch (err) {
    // fall through to bitmap path when available
    if (typeof createImageBitmap !== 'function') {
      throw err instanceof Error
        ? err
        : new Error(String(err))
    }
  }

  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob)
    const width = bitmap.width
    const height = bitmap.height
    const canvas =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(width, height)
        : Object.assign(document.createElement('canvas'), { width, height })
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D canvas context')
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
    const imageData = ctx.getImageData(0, 0, width, height)
    const { data } = imageData
    const elevations = new Float32Array(width * height)
    for (let i = 0, p = 0; i < elevations.length; i++, p += 4) {
      elevations[i] = source.decodePixel(data[p]!, data[p + 1]!, data[p + 2]!)
    }
    return { width, height, elevations }
  }

  throw new Error('Unable to decode terrain tile image in this environment')
}

export async function fetchTerrainTile(
  source: TerrainSource,
  z: number,
  x: number,
  y: number,
  cache?: TileCache,
): Promise<DecodedTerrainTile> {
  const hit = cache?.get(z, x, y)
  if (hit) return hit

  const url = source.tileUrl(z, x, y)
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Terrain tile fetch failed (${res.status}): ${url}`)
  }
  const blob = await res.blob()
  const decoded = await decodeImageToElevations(blob, source)
  const tile: DecodedTerrainTile = {
    z,
    x,
    y,
    width: decoded.width,
    height: decoded.height,
    elevations: decoded.elevations,
  }
  cache?.set(tile)
  return tile
}

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  let done = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i]!, i)
      done++
      onProgress?.(done, items.length)
    }
  }
  const n = Math.min(concurrency, Math.max(1, items.length))
  await Promise.all(Array.from({ length: n }, () => worker()))
  return results
}
