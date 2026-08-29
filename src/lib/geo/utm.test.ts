import { describe, expect, it } from 'vitest'
import { createLocalProjection, metricBoundsAroundCenter } from './projection'
import { describeUtm, utmZoneFromLon } from './utm'

describe('UTM', () => {
  it('selects zone from longitude', () => {
    expect(utmZoneFromLon(-122.4194)).toBe(10)
    expect(utmZoneFromLon(2.3522)).toBe(31)
  })

  it('rejects polar latitudes', () => {
    expect(() => describeUtm(85, 0)).toThrow(/UTM support/)
  })

  it('round-trips center through local projection', () => {
    const center = { lat: 37.7749, lon: -122.4194 }
    const proj = createLocalProjection(center)
    expect(proj.zone).toBe(10)
    expect(proj.northern).toBe(true)
    const m = proj.forward(center.lon, center.lat)
    const back = proj.inverse(m.x, m.y)
    expect(back.lat).toBeCloseTo(center.lat, 5)
    expect(back.lon).toBeCloseTo(center.lon, 5)
  })

  it('metric bounds are symmetric around center', () => {
    const center = { lat: 47.5, lon: 19.0 }
    const { bounds, centerMetric } = metricBoundsAroundCenter(center, 16384, 16384)
    expect(bounds.maxX - bounds.minX).toBe(16384)
    expect(bounds.maxY - bounds.minY).toBe(16384)
    expect((bounds.minX + bounds.maxX) / 2).toBeCloseTo(centerMetric.x, 6)
    expect((bounds.minY + bounds.maxY) / 2).toBeCloseTo(centerMetric.y, 6)
  })
})
