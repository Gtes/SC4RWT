import { useState } from 'react'
import { MapView } from '../components/map/MapView'
import { ControlsSidebar } from '../components/controls/ControlsSidebar'
import { AppHeader } from '../components/layout/AppHeader'
import { HelpModal } from '../components/layout/HelpModal'
import { useExportSettings } from '../hooks/useExportSettings'
import { useMapTheme } from '../hooks/useMapTheme'
import { useTerrainWorker } from '../hooks/useTerrainWorker'
import { describeRegion } from '../lib/sc4/region'
import './App.css'

const App = () => {
  const settings = useExportSettings()
  const worker = useTerrainWorker(settings)
  const { themeId, setThemeId } = useMapTheme()
  const [helpOpen, setHelpOpen] = useState(false)

  const region = describeRegion(settings.largeTiles, settings.largeTiles)

  return (
    <div className="app">
      <AppHeader
        center={settings.center}
        region={region}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <div className="map-panel">
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
      />

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}

export default App
