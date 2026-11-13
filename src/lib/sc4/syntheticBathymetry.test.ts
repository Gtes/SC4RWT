import { describe, expect, it } from 'vitest'
import {
  applySyntheticBathymetry,
  depthFromShoreMeters,
  distanceToShoreCells,
} from './syntheticBathymetry'

describe('syntheticBathymetry', () => {
  it('shore distance is 0 on land and grows over water', () => {
    // 3×3: center land, rest water
    const elev = new Float32Array([
      0, 0, 0,
      0, 10, 0,
      0, 0, 0,
    ])
    const dist = distanceToShoreCells(elev, 3, 3, 5)
    expect(dist[4]).toBe(0)
    expect(dist[1]).toBe(1) // N of land
    expect(dist[0]).toBe(2) // corner
  })

  it('depth is 0 at shore and approaches max with distance', () => {
    expect(depthFromShoreMeters(0, 80, 2500, 16)).toBe(0)
    const near = depthFromShoreMeters(1, 80, 2500, 16)
    const far = depthFromShoreMeters(200, 80, 2500, 16)
    expect(near).toBeGreaterThan(0)
    expect(far).toBeGreaterThan(near)
    expect(far).toBeLessThanOrEqual(80)
    expect(depthFromShoreMeters(Number.POSITIVE_INFINITY, 80, 2500, 16)).toBe(
      80,
    )
  })

  it('carves deeper water farther from shore', () => {
    const w = 5
    const h = 1
    // land | water water water water
    const elev = new Float32Array([20, 0, 0, 0, 0])
    const out = applySyntheticBathymetry(elev, w, h, {
      waterPlaneMeters: 5,
      maxDepthMeters: 40,
      falloffMeters: 64,
      cellSizeMeters: 16,
    })
    expect(out[0]).toBe(20)
    expect(out[1]!).toBeLessThan(5)
    expect(out[4]!).toBeLessThan(out[1]!)
  })

  it('all-water region uses max depth', () => {
    const elev = new Float32Array([0, 0, 0, 0])
    const out = applySyntheticBathymetry(elev, 2, 2, {
      waterPlaneMeters: 0,
      maxDepthMeters: 50,
      falloffMeters: 1000,
    })
    for (let i = 0; i < out.length; i++) {
      expect(out[i]).toBe(-50)
    }
  })
})
