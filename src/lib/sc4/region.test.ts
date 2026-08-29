import { describe, expect, it } from 'vitest'
import {
  SC4_LARGE_CITY_METERS,
  SC4_METERS_PER_CELL,
} from './constants'
import {
  describeRegion,
  outputSizeForLargeTiles,
  regionMetersForLargeTiles,
  sampleGridPositions,
} from './region'
import { encodeHeightValue, flatSeaLevelGrid } from './encodeHeight'

describe('SC4 region dimensions', () => {
  it('uses N×256+1 output size', () => {
    expect(outputSizeForLargeTiles(1)).toBe(257)
    expect(outputSizeForLargeTiles(2)).toBe(513)
    expect(outputSizeForLargeTiles(4)).toBe(1025)
    expect(outputSizeForLargeTiles(8)).toBe(2049)
  })

  it('spans exact metric size', () => {
    expect(regionMetersForLargeTiles(1)).toBe(SC4_LARGE_CITY_METERS)
    expect(regionMetersForLargeTiles(4)).toBe(16384)
    expect(SC4_LARGE_CITY_METERS).toBe(4096)
  })

  it('sample grid has 16 m intervals and correct endpoints', () => {
    const { xs, ys } = sampleGridPositions(1000, 2000, 257, 257)
    expect(xs.length).toBe(257)
    expect(ys.length).toBe(257)
    expect(xs[0]).toBe(1000)
    expect(xs[256]).toBe(1000 + 256 * SC4_METERS_PER_CELL)
    expect(xs[1]! - xs[0]!).toBe(16)
    expect(ys[256]! - ys[0]!).toBe(4096)
  })

  it('describeRegion matches 4×4 acceptance', () => {
    const r = describeRegion(4, 4)
    expect(r.widthMeters).toBe(16384)
    expect(r.heightMeters).toBe(16384)
    expect(r.widthPx).toBe(1025)
    expect(r.heightPx).toBe(1025)
  })
})

describe('SC4 height encoding', () => {
  it('maps sea level 0 m to 2500', () => {
    expect(encodeHeightValue(0)).toBe(2500)
  })

  it('maps 100 m real to 3500', () => {
    expect(encodeHeightValue(100)).toBe(3500)
  })

  it('uses water plane so inland rivers become SC4 sea level', () => {
    expect(encodeHeightValue(95, { waterPlaneMeters: 95 })).toBe(2500)
    expect(encodeHeightValue(145, { waterPlaneMeters: 95 })).toBe(3000)
  })

  it('deepens water below the plane', () => {
    expect(
      encodeHeightValue(95, { waterPlaneMeters: 95, waterDepthMeters: 20 }),
    ).toBe(2300)
  })

  it('applies vertical scale around water plane', () => {
    expect(
      encodeHeightValue(195, { waterPlaneMeters: 95, verticalScale: 0.5 }),
    ).toBe(3000)
  })

  it('clamps extremes', () => {
    expect(encodeHeightValue(-250)).toBe(0)
    expect(encodeHeightValue(10000)).toBe(65535)
  })

  it('flat sea-level grid is constant 2500', () => {
    const g = flatSeaLevelGrid(257, 257)
    expect(g.every((v: number) => v === 2500)).toBe(true)
  })
})
