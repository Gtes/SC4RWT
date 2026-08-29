import { describe, expect, it } from 'vitest'
import { elevationModeMeters, suggestAutoLevel } from './autoLevel'

function gridFrom(values: number[]): Float32Array {
  return Float32Array.from(values)
}

/** Synthetic inland city: river shelf at ~50 m, land up to ~120 m, one pit at 35. */
function dniproLike(): Float32Array {
  const out: number[] = []
  for (let i = 0; i < 8000; i++) out.push(55 + (i % 70)) // land 55–124
  for (let i = 0; i < 2000; i++) out.push(49 + (i % 3) * 0.5) // river ~49–50
  out.push(35) // single pit (old regionMin trap)
  return gridFrom(out)
}

/** Synthetic Paris-like: river ~30 m, gentle hills. */
function parisLike(): Float32Array {
  const out: number[] = []
  for (let i = 0; i < 7000; i++) out.push(35 + (i % 50))
  for (let i = 0; i < 2500; i++) out.push(28 + (i % 4))
  out.push(18)
  return gridFrom(out)
}

/** Coastal: many sea-level samples. */
function sfLike(): Float32Array {
  const out: number[] = []
  for (let i = 0; i < 3000; i++) out.push(0)
  for (let i = 0; i < 5000; i++) out.push(5 + (i % 80))
  return gridFrom(out)
}

describe('suggestAutoLevel', () => {
  it('uses coastal defaults when many samples are near sea level', () => {
    const s = suggestAutoLevel(sfLike())
    expect(s.coastal).toBe(true)
    expect(s.waterPlaneMeters).toBe(0)
    expect(s.verticalScale).toBe(1)
    expect(s.waterDepthMeters).toBe(15)
  })

  it('does not use absolute min (pit) for inland water plane', () => {
    const s = suggestAutoLevel(dniproLike())
    expect(s.coastal).toBe(false)
    expect(s.stats.min).toBeLessThan(40)
    // Plane should sit near the river shelf, not the pit
    expect(s.waterPlaneMeters).toBeGreaterThanOrEqual(45)
    expect(s.waterPlaneMeters).toBeLessThanOrEqual(55)
    expect(s.waterDepthMeters).toBe(15)
    expect(s.verticalScale).toBeGreaterThanOrEqual(1)
  })

  it('suggests ~30 m plane for Paris-like DEM', () => {
    const s = suggestAutoLevel(parisLike())
    expect(s.coastal).toBe(false)
    expect(s.waterPlaneMeters).toBeGreaterThanOrEqual(25)
    expect(s.waterPlaneMeters).toBeLessThanOrEqual(35)
    expect(s.verticalScale).toBeGreaterThan(1)
  })

  it('finds a low elevation mode', () => {
    const samples = [
      ...Array.from({ length: 100 }, () => 10),
      ...Array.from({ length: 500 }, () => 50),
      ...Array.from({ length: 500 }, () => 51),
      ...Array.from({ length: 200 }, () => 80),
    ]
    const mode = elevationModeMeters(samples, 40, 70, 2)
    expect(mode).not.toBeNull()
    expect(mode!).toBeGreaterThanOrEqual(49)
    expect(mode!).toBeLessThanOrEqual(53)
  })
})
