import { createAwsTerrariumSource } from './terrarium'
import type { TerrainSource } from '../../types/terrain'

export type { TerrainSource }

let activeSource: TerrainSource = createAwsTerrariumSource()

export function getTerrainSource(): TerrainSource {
  return activeSource
}

export function setTerrainSource(source: TerrainSource): void {
  activeSource = source
}

export { createAwsTerrariumSource }
