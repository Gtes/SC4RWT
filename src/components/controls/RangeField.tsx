import { clampNumber } from '../../utils/clamp'

interface RangeFieldProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  disabled?: boolean
  note?: string
  onChange: (value: number) => void
}

export const RangeField = ({
  label,
  min,
  max,
  step,
  value,
  disabled = false,
  note,
  onChange,
}: RangeFieldProps) => (
  <label className="field">
    <span className="field-head">
      <span>{label}</span>
      <input
        type="number"
        className="value-input"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) =>
          onChange(clampNumber(Number(e.target.value), min, max))
        }
      />
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    {note && <span className="slider-note">{note}</span>}
  </label>
)
