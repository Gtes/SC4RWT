import type { MapThemeId } from './mapThemes'
import { MAP_THEMES } from './mapThemes'

interface MapThemeSwitcherProps {
  themeId: MapThemeId
  onThemeChange: (id: MapThemeId) => void
}

export const MapThemeSwitcher = ({
  themeId,
  onThemeChange,
}: MapThemeSwitcherProps) => (
  <div className="map-theme-switcher">
    <label className="map-theme-switcher-label" htmlFor="map-theme">
      Map
    </label>
    <select
      id="map-theme"
      className="map-theme-switcher-select"
      value={themeId}
      onChange={(e) => onThemeChange(e.target.value as MapThemeId)}
      aria-label="Map theme"
    >
      {MAP_THEMES.map((theme) => (
        <option key={theme.id} value={theme.id}>
          {theme.label}
        </option>
      ))}
    </select>
  </div>
)
