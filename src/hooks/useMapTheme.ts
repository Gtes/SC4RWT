import { useCallback, useState } from 'react'
import {
  loadMapThemeId,
  saveMapThemeId,
  type MapThemeId,
} from '../components/map/mapThemes'

export const useMapTheme = () => {
  const [themeId, setThemeIdState] = useState<MapThemeId>(loadMapThemeId)

  const setThemeId = useCallback((id: MapThemeId) => {
    setThemeIdState(id)
    saveMapThemeId(id)
  }, [])

  return { themeId, setThemeId }
}
