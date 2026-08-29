import type { WaterPlaneMode } from '../../utils/urlState'
import { RangeField } from './RangeField'

interface WaterHeightPanelProps {
  waterPlaneMode: WaterPlaneMode
  waterPlaneMeters: number
  waterDepthMeters: number
  verticalScale: number
  lastAutoReason: string
  controlsLocked: boolean
  suggesting: boolean
  onWaterPlaneModeChange: (mode: WaterPlaneMode) => void
  onWaterPlaneMetersChange: (value: number) => void
  onWaterDepthMetersChange: (value: number) => void
  onVerticalScaleChange: (value: number) => void
  onCalculateManual: () => void
  onResetDefaults: () => void
}

export const WaterHeightPanel = ({
  waterPlaneMode,
  waterPlaneMeters,
  waterDepthMeters,
  verticalScale,
  lastAutoReason,
  controlsLocked,
  suggesting,
  onWaterPlaneModeChange,
  onWaterPlaneMetersChange,
  onWaterDepthMetersChange,
  onVerticalScaleChange,
  onCalculateManual,
  onResetDefaults,
}: WaterHeightPanelProps) => {
  const manual = waterPlaneMode === 'absolute'

  return (
    <fieldset className="adjust" disabled={controlsLocked}>
      <legend className="adjust-legend">
        Water &amp; height
        <button
          type="button"
          className="info-tip-btn"
          aria-label="About water and height settings"
          title={[
            'Auto: DEM leveling on generate.',
            'Manual: edit sliders.',
            'Calculate: fill from current region.',
            'Reset: coastal defaults (0 m / 15 m / 1×).',
          ].join('\n')}
        >
          ?
        </button>
      </legend>

      <label className="field">
        <span>Water plane mode</span>
        <select
          value={waterPlaneMode}
          onChange={(e) =>
            onWaterPlaneModeChange(e.target.value as WaterPlaneMode)
          }
        >
          <option value="auto">Auto (from region DEM)</option>
          <option value="absolute">Manual</option>
        </select>
      </label>

      {lastAutoReason && (
        <p className="hint auto-reason">{lastAutoReason}</p>
      )}

      <RangeField
        label="Water plane (m)"
        min={0}
        max={500}
        step={1}
        value={waterPlaneMeters}
        disabled={!manual}
        onChange={onWaterPlaneMetersChange}
      />

      <RangeField
        label="Water deepen (m)"
        min={0}
        max={80}
        step={1}
        value={waterDepthMeters}
        disabled={!manual}
        note="Extra depth below the plane (stronger blue)"
        onChange={onWaterDepthMetersChange}
      />

      <RangeField
        label="Vertical scale"
        min={0.5}
        max={2}
        step={0.01}
        value={verticalScale}
        disabled={!manual}
        note="&lt;1 gentler hills · &gt;1 more dramatic"
        onChange={onVerticalScaleChange}
      />

      {manual && (
        <div className="manual-actions">
          <button
            type="button"
            onClick={onCalculateManual}
            disabled={controlsLocked}
            aria-busy={suggesting}
          >
            {suggesting && <span className="btn-spinner" aria-hidden />}
            Calculate from DEM
          </button>
          <button
            type="button"
            onClick={onResetDefaults}
            disabled={controlsLocked}
          >
            Reset to defaults
          </button>
        </div>
      )}
    </fieldset>
  )
}
