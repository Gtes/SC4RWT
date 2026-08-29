import {
  SC4_SUPPORTED_REGION_SIZES,
  type Sc4RegionSize,
} from '../../lib/sc4/constants'
import type { WaterPlaneMode } from '../../utils/urlState'
import { WaterHeightPanel } from './WaterHeightPanel'

interface ControlsSidebarProps {
  largeTiles: Sc4RegionSize
  busy: boolean
  suggesting: boolean
  controlsLocked: boolean
  errorMessage: string | null
  waterPlaneMode: WaterPlaneMode
  waterPlaneMeters: number
  waterDepthMeters: number
  verticalScale: number
  lastAutoReason: string
  onLargeTilesChange: (size: Sc4RegionSize) => void
  onWaterPlaneModeChange: (mode: WaterPlaneMode) => void
  onWaterPlaneMetersChange: (value: number) => void
  onWaterDepthMetersChange: (value: number) => void
  onVerticalScaleChange: (value: number) => void
  onGenerate: () => void
  onCancel: () => void
  onCalculateManual: () => void
  onResetDefaults: () => void
}

export const ControlsSidebar = ({
  largeTiles,
  busy,
  suggesting,
  controlsLocked,
  errorMessage,
  waterPlaneMode,
  waterPlaneMeters,
  waterDepthMeters,
  verticalScale,
  lastAutoReason,
  onLargeTilesChange,
  onWaterPlaneModeChange,
  onWaterPlaneMetersChange,
  onWaterDepthMetersChange,
  onVerticalScaleChange,
  onGenerate,
  onCancel,
  onCalculateManual,
  onResetDefaults,
}: ControlsSidebarProps) => (
  <aside className="controls">
    <label className="field">
      <span>Region size (large cities)</span>
      <select
        value={largeTiles}
        onChange={(e) =>
          onLargeTilesChange(Number(e.target.value) as Sc4RegionSize)
        }
        disabled={controlsLocked}
      >
        {SC4_SUPPORTED_REGION_SIZES.map((n) => (
          <option key={n} value={n}>
            {n} × {n} large
          </option>
        ))}
      </select>
    </label>

    <div className="actions">
      <button
        type="button"
        className="primary"
        onClick={onGenerate}
        disabled={controlsLocked}
        aria-busy={busy}
      >
        {busy && <span className="btn-spinner" aria-hidden />}
        Generate PNG
      </button>
      <button type="button" onClick={onCancel} disabled={!controlsLocked}>
        Cancel
      </button>
    </div>

    {errorMessage && <p className="action-error">{errorMessage}</p>}

    <WaterHeightPanel
      waterPlaneMode={waterPlaneMode}
      waterPlaneMeters={waterPlaneMeters}
      waterDepthMeters={waterDepthMeters}
      verticalScale={verticalScale}
      lastAutoReason={lastAutoReason}
      controlsLocked={controlsLocked}
      suggesting={suggesting}
      onWaterPlaneModeChange={onWaterPlaneModeChange}
      onWaterPlaneMetersChange={onWaterPlaneMetersChange}
      onWaterDepthMetersChange={onWaterDepthMetersChange}
      onVerticalScaleChange={onVerticalScaleChange}
      onCalculateManual={onCalculateManual}
      onResetDefaults={onResetDefaults}
    />
  </aside>
)
