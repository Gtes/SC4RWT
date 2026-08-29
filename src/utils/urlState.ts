import {
  SC4_SUPPORTED_REGION_SIZES,
  type Sc4RegionSize,
} from '../lib/sc4/constants'
import type { LatLon } from '../types/terrain'
import { clampNumber } from './clamp'

export type WaterPlaneMode = 'auto' | 'absolute'

export interface AppUrlState {
  center: LatLon
  largeTiles: Sc4RegionSize
  waterPlaneMode: WaterPlaneMode
  waterPlaneMeters: number
  waterDepthMeters: number
  verticalScale: number
}

export const URL_DEFAULTS: AppUrlState = {
  center: { lat: 37.7749, lon: -122.4194 },
  largeTiles: 4,
  waterPlaneMode: 'auto',
  waterPlaneMeters: 0,
  waterDepthMeters: 15,
  verticalScale: 1,
}

const parseNumber = (raw: string | null): number | null => {
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

const isRegionSize = (n: number): n is Sc4RegionSize =>
  (SC4_SUPPORTED_REGION_SIZES as readonly number[]).includes(n)

/** Read shareable settings from `?lat=&lon=&size=&mode=&plane=&deepen=&scale=` */
export const parseAppUrlSearch = (
  search: string,
  defaults: AppUrlState = URL_DEFAULTS,
): AppUrlState => {
  const q = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  )
  const lat = parseNumber(q.get('lat'))
  const lon = parseNumber(q.get('lon'))
  const size = parseNumber(q.get('size'))
  const modeRaw = q.get('mode')
  const plane = parseNumber(q.get('plane'))
  const deepen = parseNumber(q.get('deepen'))
  const scale = parseNumber(q.get('scale'))

  let waterPlaneMode: WaterPlaneMode = defaults.waterPlaneMode
  if (modeRaw === 'auto' || modeRaw === 'manual' || modeRaw === 'absolute') {
    waterPlaneMode = modeRaw === 'manual' ? 'absolute' : modeRaw
  }

  return {
    center: {
      lat: lat != null ? clampNumber(lat, -85, 85) : defaults.center.lat,
      lon: lon != null ? clampNumber(lon, -180, 180) : defaults.center.lon,
    },
    largeTiles:
      size != null && isRegionSize(size) ? size : defaults.largeTiles,
    waterPlaneMode,
    waterPlaneMeters:
      plane != null
        ? clampNumber(Math.round(plane), 0, 500)
        : defaults.waterPlaneMeters,
    waterDepthMeters:
      deepen != null
        ? clampNumber(Math.round(deepen), 0, 80)
        : defaults.waterDepthMeters,
    verticalScale:
      scale != null
        ? clampNumber(Math.round(scale * 100) / 100, 0.5, 2)
        : defaults.verticalScale,
  }
}

export const parseAppUrlFromLocation = (
  defaults: AppUrlState = URL_DEFAULTS,
): AppUrlState => {
  if (typeof window === 'undefined') return defaults
  return parseAppUrlSearch(window.location.search, defaults)
}

export const buildAppUrlSearch = (state: AppUrlState): string => {
  const q = new URLSearchParams()
  q.set('lat', state.center.lat.toFixed(5))
  q.set('lon', state.center.lon.toFixed(5))
  q.set('size', String(state.largeTiles))
  q.set('mode', state.waterPlaneMode === 'absolute' ? 'manual' : 'auto')
  q.set('plane', String(Math.round(state.waterPlaneMeters)))
  q.set('deepen', String(Math.round(state.waterDepthMeters)))
  q.set('scale', state.verticalScale.toFixed(2))
  return q.toString()
}

/** Update the address bar without adding history entries (shareable filters). */
export const replaceAppUrl = (state: AppUrlState): void => {
  if (typeof window === 'undefined') return
  const search = buildAppUrlSearch(state)
  const next = `${window.location.pathname}?${search}${window.location.hash}`
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next === current) return
  window.history.replaceState(null, '', next)
}
