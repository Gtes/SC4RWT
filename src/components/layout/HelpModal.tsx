import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export const HelpModal = ({ open, onClose }: HelpModalProps) => {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="help-modal-root" role="presentation">
      <button
        type="button"
        className="help-modal-backdrop"
        aria-label="Close help"
        onClick={onClose}
      />
      <div
        className="help-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="help-modal-header">
          <h2 id={titleId}>How to use SC4RWT</h2>
          <button
            ref={closeRef}
            type="button"
            className="help-modal-close"
            onClick={onClose}
            aria-label="Close help"
          >
            ×
          </button>
        </div>

        <div className="help-modal-body">
          <p className="help-lead">
            Turns a real-world map selection into a 16-bit grayscale heightmap
            PNG for SimCity 4 regions.
          </p>

          <h3>1. Aim with the map</h3>
          <p>
            The orange square in the middle of the map is your{' '}
            <strong>export region</strong>. It stays fixed on screen —{' '}
            <strong>pan the map underneath</strong> to choose where in the real
            world to export.
          </p>
          <ul>
            <li>
              <strong>Zoom</strong> only changes how large the square looks. It
              does <strong>not</strong> change the real-world size of the
              export.
            </li>
            <li>
              Use the <strong>Map</strong> dropdown (top-right of the map) to
              switch between Standard, Dark, Light, Topo, or Satellite tiles if
              that helps you aim.
            </li>
          </ul>

          <h3>2. Pick a region size</h3>
          <p>
            Under <strong>Region size (large cities)</strong>, choose how big
            the SimCity 4 region should be:
          </p>
          <div className="help-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Size</th>
                  <th>What it means</th>
                  <th>Rough real-world span</th>
                  <th>Output PNG</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>1×1</strong>
                  </td>
                  <td>One large city</td>
                  <td>~4.1 × 4.1 km</td>
                  <td>257 × 257</td>
                </tr>
                <tr>
                  <td>
                    <strong>2×2</strong>
                  </td>
                  <td>Four large cities</td>
                  <td>~8.2 × 8.2 km</td>
                  <td>513 × 513</td>
                </tr>
                <tr>
                  <td>
                    <strong>4×4</strong>
                  </td>
                  <td>Sixteen large cities</td>
                  <td>~16.4 × 16.4 km</td>
                  <td>1025 × 1025</td>
                </tr>
                <tr>
                  <td>
                    <strong>8×8</strong>
                  </td>
                  <td>Sixty-four large cities</td>
                  <td>~32.8 × 32.8 km</td>
                  <td>2049 × 2049</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Scale is always <strong>1 terrain cell = 16 meters</strong>. Bigger
            sizes take longer to generate and download a larger PNG.
          </p>

          <h3>3. Water &amp; height</h3>
          <p>
            These settings control how real elevation becomes SC4 terrain (what
            shows as water vs land, and how steep hills look).
          </p>

          <h4>Auto mode (recommended to start)</h4>
          <p>
            Set <strong>Water plane mode</strong> to{' '}
            <strong>Auto (from region DEM)</strong>.
          </p>
          <p>
            When you click <strong>Generate PNG</strong>, the app samples
            elevations under the orange square and picks sensible values for
            you:
          </p>
          <ul>
            <li>
              <strong>Coast / ocean</strong> → water plane near{' '}
              <strong>0 m</strong> sea level
            </li>
            <li>
              <strong>Inland rivers / lakes</strong> → water plane near the low
              elevation band in that area
            </li>
            <li>
              <strong>Vertical scale</strong> may bump up a bit in flatter areas
              so relief still reads in-game
            </li>
          </ul>
          <p>
            You’ll see a short reason under the controls after generate (or
            after Calculate in Manual).
          </p>
          <p className="help-note">
            <strong>Note:</strong> Auto is still a{' '}
            <strong>work in progress</strong> — it often helps, but it does{' '}
            <strong>not always</strong> pick a perfect water plane or scale for
            every region. If the shore looks wrong or hills are too flat/steep,
            switch to <strong>Manual</strong>, use{' '}
            <strong>Calculate from DEM</strong> as a starting point, then tweak
            the sliders.
          </p>

          <h4>Manual mode</h4>
          <p>
            Set <strong>Water plane mode</strong> to <strong>Manual</strong>{' '}
            when you want full control:
          </p>
          <div className="help-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Control</th>
                  <th>What it does</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Water plane (m)</strong>
                  </td>
                  <td>
                    Real-world elevation treated as SC4 sea level. Land above
                    this stays dry; below becomes water.
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Water deepen (m)</strong>
                  </td>
                  <td>
                    Extra depth pushed below the plane so water looks deeper /
                    more blue in SC4.
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Vertical scale</strong>
                  </td>
                  <td>
                    Stretches or flattens hills. <strong>&lt; 1</strong> =
                    gentler; <strong>&gt; 1</strong> = more dramatic.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>Helpful buttons in Manual:</p>
          <ul>
            <li>
              <strong>Calculate from DEM</strong> — samples the current map
              region and fills the three sliders (same idea as Auto, but you can
              tweak afterward).
            </li>
            <li>
              <strong>Reset to defaults</strong> — coastal starter: plane{' '}
              <strong>0 m</strong>, deepen <strong>15 m</strong>, scale{' '}
              <strong>1×</strong>.
            </li>
          </ul>

          <h3>4. Generate</h3>
          <p>
            Click <strong>Generate PNG</strong>. A spinner on the button means
            it’s working; the heightmap downloads when ready.
          </p>
          <ul>
            <li>
              Use <strong>Cancel</strong> if you need to stop.
            </li>
            <li>
              Your current map center, size, and water settings are kept in the{' '}
              <strong>URL</strong>, so you can bookmark or share the exact
              setup.
            </li>
          </ul>

          <div className="help-tip">
            <h4>Tip</h4>
            <p>
              Try <strong>Auto</strong> first for a quick generate. If the shore
              or hills look off, switch to <strong>Manual</strong>, click{' '}
              <strong>Calculate from DEM</strong> for a starting guess, then
              nudge plane / deepen / scale. You can also skip Auto entirely and
              stay in Manual the whole time.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
