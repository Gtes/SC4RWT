export interface LatLon {
  lat: number
  lon: number
}

export interface MetricPoint {
  x: number
  y: number
}

export interface MetricBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface DecodedTerrainTile {
  z: number
  x: number
  y: number
  width: number
  height: number
  elevations: Float32Array
}

export interface GenerateRequest {
  center: LatLon
  largeTilesX: number
  largeTilesY: number
  /** Terrarium zoom; optional override */
  sourceZoom?: number
  /**
   * Real m AMSL that becomes SC4 sea level.
   * Ignored when waterPlaneMode is `auto` (or legacy `regionMin`).
   */
  waterPlaneMeters?: number
  /**
   * absolute = manual sliders;
   * auto = DEM stats (low mode / percentile + relief scale);
   * regionMin = legacy alias for auto (absolute min was too aggressive).
   */
  waterPlaneMode?: 'absolute' | 'auto' | 'regionMin'
  verticalScale?: number
  /** Extra depth (m) for samples at/below water plane. Ignored in auto. */
  waterDepthMeters?: number
}

export interface AppliedHeightAdjustments {
  waterPlaneMeters: number
  verticalScale: number
  waterDepthMeters: number
  coastal: boolean
  reason: string
}

export type GenerationProgress =
  | { stage: 'fetching'; progress: number }
  | { stage: 'decoding'; progress: number }
  | { stage: 'resampling'; progress: number }
  | { stage: 'encoding'; progress: number }
  | {
      stage: 'done'
      blob: Blob
      width: number
      height: number
      applied?: AppliedHeightAdjustments
    }
  | { stage: 'error'; message: string }

export interface TerrainSource {
  readonly id: string
  tileUrl(z: number, x: number, y: number): string
  decodePixel(r: number, g: number, b: number): number
  isNodata(meters: number): boolean
}
