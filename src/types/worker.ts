import type {
  AppliedHeightAdjustments,
  GenerateRequest,
  GenerationProgress,
  LatLon,
} from './terrain'

export type SuggestRequest = {
  center: LatLon
  largeTilesX: number
  largeTilesY: number
}

export type WorkerInbound =
  | { type: 'generate'; request: GenerateRequest }
  | { type: 'suggest'; request: SuggestRequest }
  | { type: 'cancel' }

export type WorkerOutbound =
  | ({ type: 'progress' } & GenerationProgress)
  | { type: 'suggestResult'; applied: AppliedHeightAdjustments }
  | { type: 'suggestError'; message: string }
