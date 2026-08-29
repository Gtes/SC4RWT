import type { TerrainSource } from '../../types/terrain'

/** Terrarium RGB → meters */
export function decodeTerrarium(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768
}

/**
 * Terrarium ocean is often encoded near 0; extreme sentinel values are rare.
 * Treat NaN / non-finite as nodata. Values exactly at -32768 are empty.
 */
export function isTerrariumNodata(meters: number): boolean {
  return !Number.isFinite(meters) || meters <= -32768
}

export const AWS_TERRARIUM_BASE =
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium'

export function createAwsTerrariumSource(): TerrainSource {
  return {
    id: 'aws-terrarium',
    tileUrl(z, x, y) {
      return `${AWS_TERRARIUM_BASE}/${z}/${x}/${y}.png`
    },
    decodePixel: decodeTerrarium,
    isNodata: isTerrariumNodata,
  }
}
