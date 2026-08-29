import { describe, expect, it } from 'vitest'
import { buildRegionGeometry } from './regionGeometry'

describe('regionGeometry', () => {
  it('builds closed outline and grid for 2×2', () => {
    const g = buildRegionGeometry({ lat: 40.0, lon: -74.0 }, 2, 2)
    expect(g.widthPx).toBe(513)
    expect(g.heightMeters).toBe(8192)
    expect(g.outline.length).toBeGreaterThan(4)
    expect(g.gridLines.length).toBe(2) // one vertical + one horizontal divider
  })
})
