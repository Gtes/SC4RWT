import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { metricBoundsAroundCenter } from '../../lib/geo/projection'
import { describeRegion } from '../../lib/sc4/region'
import type { LatLon } from '../../types/terrain'
import { getMapTheme, type MapThemeId } from './mapThemes'
import { MapThemeSwitcher } from './MapThemeSwitcher'

interface MapViewProps {
  center: LatLon
  largeTiles: number
  themeId: MapThemeId
  onCenterChange: (center: LatLon) => void
  onThemeChange: (id: MapThemeId) => void
}

interface ScopeFrame {
  width: number
  height: number
}

/**
 * Game-style scope: HTML overlay fixed at viewport center.
 * Map pans underneath; only size updates with zoom / latitude.
 */
const ScopeOverlay = ({
  largeTiles,
  onCenterChange,
}: {
  largeTiles: number
  onCenterChange: (center: LatLon) => void
}) => {
  const map = useMap()
  const [frame, setFrame] = useState<ScopeFrame>({ width: 0, height: 0 })

  const refresh = useCallback(() => {
    const c = map.getCenter()
    onCenterChange({ lat: c.lat, lon: c.lng })

    const region = describeRegion(largeTiles, largeTiles)
    const { projection, bounds } = metricBoundsAroundCenter(
      { lat: c.lat, lon: c.lng },
      region.widthMeters,
      region.heightMeters,
    )
    const midY = (bounds.minY + bounds.maxY) / 2
    const midX = (bounds.minX + bounds.maxX) / 2
    const west = projection.inverse(bounds.minX, midY)
    const east = projection.inverse(bounds.maxX, midY)
    const south = projection.inverse(midX, bounds.minY)
    const north = projection.inverse(midX, bounds.maxY)

    const w = map.latLngToContainerPoint([west.lat, west.lon])
    const e = map.latLngToContainerPoint([east.lat, east.lon])
    const s = map.latLngToContainerPoint([south.lat, south.lon])
    const n = map.latLngToContainerPoint([north.lat, north.lon])

    setFrame({
      width: Math.hypot(e.x - w.x, e.y - w.y),
      height: Math.hypot(n.x - s.x, n.y - s.y),
    })
  }, [largeTiles, map, onCenterChange])

  useMapEvents({
    move: refresh,
    zoom: refresh,
    zoomend: refresh,
    resize: refresh,
  })

  useEffect(() => {
    refresh()
  }, [refresh])

  const gridFrac = Array.from(
    { length: largeTiles - 1 },
    (_, i) => (i + 1) / largeTiles,
  )

  return createPortal(
    <div className="map-scope" aria-hidden>
      <div
        className="map-scope-square"
        style={{
          width: Math.max(0, frame.width),
          height: Math.max(0, frame.height),
        }}
      >
        {gridFrac.map((t) => (
          <span
            key={`v-${t}`}
            className="map-scope-grid map-scope-grid-v"
            style={{ left: `${t * 100}%` }}
          />
        ))}
        {gridFrac.map((t) => (
          <span
            key={`h-${t}`}
            className="map-scope-grid map-scope-grid-h"
            style={{ top: `${t * 100}%` }}
          />
        ))}
        <span className="map-scope-dot" />
      </div>
    </div>,
    map.getContainer(),
  )
}

const SyncViewToCenter = ({ center }: { center: LatLon }) => {
  const map = useMap()
  useEffect(() => {
    const c = map.getCenter()
    if (
      Math.abs(c.lat - center.lat) > 1e-7 ||
      Math.abs(c.lng - center.lon) > 1e-7
    ) {
      map.setView([center.lat, center.lon], map.getZoom(), { animate: false })
    }
  }, [center.lat, center.lon, map])
  return null
}

const InvalidateSizeOnMount = () => {
  const map = useMap()
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 0)
    return () => window.clearTimeout(id)
  }, [map])
  return null
}

export const MapView = ({
  center,
  largeTiles,
  themeId,
  onCenterChange,
  onThemeChange,
}: MapViewProps) => {
  const theme = getMapTheme(themeId)

  return (
    <div className="map-view-wrap">
      <MapThemeSwitcher themeId={themeId} onThemeChange={onThemeChange} />
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={10}
        className="leaflet-map"
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          key={theme.id}
          attribution={theme.attribution}
          url={theme.url}
          maxZoom={theme.maxZoom}
          {...(theme.subdomains ? { subdomains: theme.subdomains } : {})}
        />
        <InvalidateSizeOnMount />
        <SyncViewToCenter center={center} />
        <ScopeOverlay largeTiles={largeTiles} onCenterChange={onCenterChange} />
      </MapContainer>
      <p className="map-hint">
        Scope stays locked to screen center — pan the map underneath to aim.
        Zoom changes how large it looks, not the real-world export size.
      </p>
    </div>
  )
}
