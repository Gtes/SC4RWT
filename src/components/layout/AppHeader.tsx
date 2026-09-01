import { SC4_METERS_PER_CELL } from '../../lib/sc4/constants'
import type { RegionSpec } from '../../lib/sc4/region'
import type { LatLon } from '../../types/terrain'

interface AppHeaderProps {
  center: LatLon
  region: RegionSpec
}

export const AppHeader = ({ center, region }: AppHeaderProps) => (
  <header className="app-header">
    <div className="header-brand">
      <div className="header-title-row">
        <h1>SC4 Real-World Terrain</h1>
        <a
          className="support-ukraine"
          href="https://u24.gov.ua/"
          target="_blank"
          rel="noopener noreferrer"
          title="United24 - Donate to support Ukraine's independence."
          aria-label="Support Ukraine"
        >
          <span className="support-ukraine__flag__blue" />
          <span className="support-ukraine__flag__yellow" />
        </a>
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
