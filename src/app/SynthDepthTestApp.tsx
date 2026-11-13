import { useMemo, useState } from 'react'
import { ControlsSidebar } from '../components/controls/ControlsSidebar'
import { RangeField } from '../components/controls/RangeField'
import { AppHeader } from '../components/layout/AppHeader'
import { HelpModal } from '../components/layout/HelpModal'
import { MapView } from '../components/map/MapView'
import { useExportSettings } from '../hooks/useExportSettings'
import { useMapTheme } from '../hooks/useMapTheme'
import { useTerrainWorker } from '../hooks/useTerrainWorker'
import { describeRegion } from '../lib/sc4/region'
import { DEFAULT_SYNTH_BATHYMETRY } from '../lib/sc4/syntheticBathymetry'
import { appHomeHref } from '../utils/appPaths'
import './App.css'

/**
 * Experimental playground: synthetic bathymetry from distance-to-shore.
 * Route: /test-synth-depth
 */
const SynthDepthTestApp = () => {
  const settings = useExportSettings()
  const [maxDepthMeters, setMaxDepthMeters] = useState<number>(
    DEFAULT_SYNTH_BATHYMETRY.maxDepthMeters,
  )
  const [falloffMeters, setFalloffMeters] = useState<number>(
    DEFAULT_SYNTH_BATHYMETRY.falloffMeters,
  )

  const syntheticBathymetry = useMemo(
    () => ({
      enabled: true as const,
      maxDepthMeters,
      falloffMeters,
    }),
    [falloffMeters, maxDepthMeters],
  )

  const worker = useTerrainWorker({ ...settings, syntheticBathymetry })
  const { themeId, setThemeId } = useMapTheme()
  const [helpOpen, setHelpOpen] = useState(false)

  const region = describeRegion(settings.largeTiles, settings.largeTiles)

  return (
    <div className="app">
      <AppHeader center={settings.center} region={region} />

      <div className="map-panel">
        <div className="exp-banner" role="status">
          <strong>Experimental:</strong> synthetic underwater depth from
          distance-to-shore (not real bathymetry).{' '}
          <a href={appHomeHref()}>← Back to main app</a>
        </div>
        <MapView
          center={settings.center}
          largeTiles={settings.largeTiles}
          themeId={themeId}
          onCenterChange={settings.setCenter}
          onThemeChange={setThemeId}
        />
      </div>

      <ControlsSidebar
        largeTiles={settings.largeTiles}
        busy={worker.busy}
        suggesting={worker.suggesting}
        controlsLocked={worker.controlsLocked}
        errorMessage={worker.errorMessage}
        waterPlaneMode={settings.waterPlaneMode}
        waterPlaneMeters={settings.waterPlaneMeters}
        waterDepthMeters={settings.waterDepthMeters}
        verticalScale={settings.verticalScale}
        lastAutoReason={worker.lastAutoReason}
        onLargeTilesChange={settings.setLargeTiles}
        onWaterPlaneModeChange={settings.setWaterPlaneMode}
        onWaterPlaneMetersChange={settings.setWaterPlaneMeters}
        onWaterDepthMetersChange={settings.setWaterDepthMeters}
        onVerticalScaleChange={settings.setVerticalScale}
        onGenerate={worker.onGenerate}
        onCancel={worker.onCancel}
        onCalculateManual={worker.onCalculateManual}
        onResetDefaults={worker.onResetDefaults}
        onOpenHelp={() => setHelpOpen(true)}
        experimentalSlot={
          <fieldset className="adjust exp-synth" disabled={worker.controlsLocked}>
            <legend>Synthetic bathymetry</legend>
            <p className="hint">
              Water below the plane is carved deeper farther from shore. Flat
              “Water deepen” is ignored here.
            </p>
            <RangeField
              label="Max depth (m)"
              min={10}
              max={200}
              step={5}
              value={maxDepthMeters}
              note="Cap on underwater depth"
              onChange={setMaxDepthMeters}
            />
            <RangeField
              label="Falloff (m)"
              min={200}
              max={10000}
              step={100}
              value={falloffMeters}
              note="How quickly depth approaches the max"
              onChange={setFalloffMeters}
            />
          </fieldset>
        }
      />

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}

export default SynthDepthTestApp
