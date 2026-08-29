export type MapThemeId = 'standard' | 'dark' | 'light' | 'topo' | 'satellite'

export interface MapTheme {
  id: MapThemeId
  label: string
  url: string
  attribution: string
  maxZoom: number
  subdomains?: string
}

export const MAP_THEMES: MapTheme[] = [
  {
    id: 'standard',
    label: 'Standard',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  {
    id: 'dark',
    label: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: 'abcd',
  },
  {
    id: 'light',
    label: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: 'abcd',
  },
  {
    id: 'topo',
    label: 'Topo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
    subdomains: 'abc',
  },
  {
    id: 'satellite',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 19,
  },
]

export const DEFAULT_MAP_THEME_ID: MapThemeId = 'standard'

export const getMapTheme = (id: MapThemeId): MapTheme =>
  MAP_THEMES.find((t) => t.id === id) ?? MAP_THEMES[0]

const STORAGE_KEY = 'sc4rwt-map-theme'

export const loadMapThemeId = (): MapThemeId => {
  if (typeof window === 'undefined') return DEFAULT_MAP_THEME_ID
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return MAP_THEMES.some((t) => t.id === stored)
    ? (stored as MapThemeId)
    : DEFAULT_MAP_THEME_ID
}

export const saveMapThemeId = (id: MapThemeId): void => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, id)
}
