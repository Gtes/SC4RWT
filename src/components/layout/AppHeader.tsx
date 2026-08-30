import { SC4_METERS_PER_CELL } from '../../lib/sc4/constants'
import type { RegionSpec } from '../../lib/sc4/region'
import type { LatLon } from '../../types/terrain'

interface AppHeaderProps {
  center: LatLon
  region: RegionSpec
  onOpenHelp: () => void
}

export const AppHeader = ({ center, region, onOpenHelp }: AppHeaderProps) => (
  <header className="app-header">
    <div className="header-brand">
      <div className="header-title-row">
        <h1>SC4 Real-World Terrain</h1>
        <button
          type="button"
          className="help-btn"
          onClick={onOpenHelp}
          title="How to use"
          aria-label="How to use"
        >
          ?
        </button>
      </div>
      <p className="tagline">
        Aim with the fixed center scope — zoom never changes export scale
      </p>
    </div>
    <dl className="header-stats">
      <div>
        <dt>Export center</dt>
        <dd>
          {center.lat.toFixed(5)}, {center.lon.toFixed(5)}
        </dd>
      </div>
      <div>
        <dt>Real size</dt>
        <dd>
          {(region.widthMeters / 1000).toFixed(3)} ×{' '}
          {(region.heightMeters / 1000).toFixed(3)} km
        </dd>
      </div>
      <div>
        <dt>Output</dt>
        <dd>
          {region.widthPx} × {region.heightPx}
        </dd>
      </div>
      <div>
        <dt>Scale</dt>
        <dd>1 cell = {SC4_METERS_PER_CELL} m</dd>
      </div>
    </dl>
  </header>
)
