import { describe, expect, it } from 'vitest'
import {
  buildAppUrlSearch,
  parseAppUrlSearch,
  URL_DEFAULTS,
} from './urlState'

describe('urlState', () => {
  it('round-trips share params', () => {
    const state = {
      center: { lat: 48.8566, lon: 2.3522 },
      largeTiles: 4 as const,
      waterPlaneMode: 'absolute' as const,
      waterPlaneMeters: 30,
      waterDepthMeters: 15,
      verticalScale: 1.35,
    }
    const parsed = parseAppUrlSearch(buildAppUrlSearch(state))
    expect(parsed.center.lat).toBeCloseTo(48.8566, 4)
    expect(parsed.center.lon).toBeCloseTo(2.3522, 4)
    expect(parsed.largeTiles).toBe(4)
    expect(parsed.waterPlaneMode).toBe('absolute')
    expect(parsed.waterPlaneMeters).toBe(30)
    expect(parsed.waterDepthMeters).toBe(15)
    expect(parsed.verticalScale).toBe(1.35)
  })

  it('uses defaults for empty / invalid search', () => {
    expect(parseAppUrlSearch('')).toEqual(URL_DEFAULTS)
    expect(parseAppUrlSearch('?size=3&mode=nope&scale=99').largeTiles).toBe(4)
    expect(parseAppUrlSearch('?mode=manual').waterPlaneMode).toBe('absolute')
  })

  it('serializes manual mode as mode=manual', () => {
    const q = buildAppUrlSearch({
      ...URL_DEFAULTS,
      waterPlaneMode: 'absolute',
    })
    expect(q).toContain('mode=manual')
  })
})
