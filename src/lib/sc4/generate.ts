import { encode16BitGrayscalePng } from '../png/encode16BitGrayscalePng'
import { getTerrainSource } from '../terrain/terrainSource'
import type {
  AppliedHeightAdjustments,
  GenerateRequest,
  GenerationProgress,
  LatLon,
} from '../../types/terrain'
import { suggestAutoLevel } from './autoLevel'
import { encodeHeightGrid } from './encodeHeight'
import {
  resampleRegionToSc4Grid,
  sampleRegionElevationsCoarse,
  type ResampleProgress,
} from './resample'

function resolveHeightAdjustments(
  request: GenerateRequest,
  elevations: Float32Array,
  isNodata: (m: number) => boolean,
): AppliedHeightAdjustments {
  const mode = request.waterPlaneMode ?? 'auto'
  if (mode === 'auto' || mode === 'regionMin') {
    const s = suggestAutoLevel(elevations, { isNodata })
    return {
      waterPlaneMeters: s.waterPlaneMeters,
      verticalScale: s.verticalScale,
      waterDepthMeters: s.waterDepthMeters,
      coastal: s.coastal,
      reason: s.reason,
    }
  }
  return {
    waterPlaneMeters: request.waterPlaneMeters ?? 0,
    verticalScale: request.verticalScale ?? 1,
    waterDepthMeters: request.waterDepthMeters ?? 0,
    coastal: false,
    reason: 'Manual absolute settings',
  }
}

export async function suggestAdjustmentsForRegion(
  center: LatLon,
  largeTilesX: number,
  largeTilesY: number,
  onProgress?: (p: ResampleProgress) => void,
): Promise<AppliedHeightAdjustments> {
  const source = getTerrainSource()
  const elevations = await sampleRegionElevationsCoarse(
    center,
    largeTilesX,
    largeTilesY,
    { onProgress },
  )
  const s = suggestAutoLevel(elevations, {
    isNodata: (m) => source.isNodata(m),
  })
  return {
    waterPlaneMeters: s.waterPlaneMeters,
    verticalScale: s.verticalScale,
    waterDepthMeters: s.waterDepthMeters,
    coastal: s.coastal,
    reason: s.reason,
  }
}

export async function generateTerrainPng(
  request: GenerateRequest,
  onProgress?: (p: GenerationProgress) => void,
): Promise<{
  blob: Blob
  width: number
  height: number
  applied: AppliedHeightAdjustments
}> {
  try {
    const source = getTerrainSource()
    const { width, height, elevations } = await resampleRegionToSc4Grid(
      request.center,
      request.largeTilesX,
      request.largeTilesY,
      {
        sourceZoom: request.sourceZoom,
        onProgress: (p) => {
          onProgress?.({ stage: p.stage, progress: p.progress })
        },
      },
    )

    onProgress?.({ stage: 'encoding', progress: 0.5 })

    const applied = resolveHeightAdjustments(
      request,
      elevations,
      (m) => source.isNodata(m),
    )

    const values = encodeHeightGrid(elevations, {
      waterPlaneMeters: applied.waterPlaneMeters,
      verticalScale: applied.verticalScale,
      waterDepthMeters: applied.waterDepthMeters,
      treatAsOcean: (m) => source.isNodata(m),
    })
    const blob = encode16BitGrayscalePng(width, height, values)
    onProgress?.({ stage: 'encoding', progress: 1 })
    onProgress?.({ stage: 'done', blob, width, height, applied })
    return { blob, width, height, applied }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    onProgress?.({ stage: 'error', message })
    throw err
  }
}
