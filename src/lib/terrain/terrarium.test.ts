import { describe, expect, it } from 'vitest'
import { decodeTerrarium } from './terrarium'
import { bilinear } from './sampleTerrain'
import { lonToTileX, latToTileY, lonLatToTilePixel } from './tileMath'

describe('Terrarium decode', () => {
  it('decodes sea-level-ish mid values', () => {
    // r=128,g=0,b=0 → 128*256 + 0 + 0 - 32768 = 0
    expect(decodeTerrarium(128, 0, 0)).toBe(0)
  })

  it('decodes fractional blue', () => {
    expect(decodeTerrarium(128, 0, 128)).toBeCloseTo(0.5, 5)
  })
})

describe('bilinear', () => {
  it('interpolates corners', () => {
    expect(bilinear(10, 20, 30, 40, 0, 0)).toBe(10)
    expect(bilinear(10, 20, 30, 40, 1, 0)).toBe(20)
    expect(bilinear(10, 20, 30, 40, 0, 1)).toBe(30)
    expect(bilinear(10, 20, 30, 40, 1, 1)).toBe(40)
    expect(bilinear(10, 20, 30, 40, 0.5, 0.5)).toBe(25)
  })
})

describe('tile math', () => {
  it('computes known SF tile at z13', () => {
    // San Francisco approx
    const x = lonToTileX(-122.4194, 13)
    const y = latToTileY(37.7749, 13)
    expect(x).toBeGreaterThan(1300)
    expect(y).toBeGreaterThan(3100)
    const px = lonLatToTilePixel(-122.4194, 37.7749, 13)
    expect(px.px).toBeGreaterThanOrEqual(0)
    expect(px.px).toBeLessThan(256)
  })
})
