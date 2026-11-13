import { describe, expect, it } from 'vitest'
import { isSynthDepthTestPath } from './appPaths'

describe('isSynthDepthTestPath', () => {
  it('matches bare and trailing-slash paths', () => {
    expect(isSynthDepthTestPath('/test-synth-depth')).toBe(true)
    expect(isSynthDepthTestPath('/test-synth-depth/')).toBe(true)
  })

  it('matches under a project base path', () => {
    // BASE_URL is `/` in unit tests; still accept full GH Pages-style paths
    // by checking the suffix when base is root.
    expect(isSynthDepthTestPath('/SC4RWT/test-synth-depth')).toBe(true)
  })

  it('rejects the main app path', () => {
    expect(isSynthDepthTestPath('/')).toBe(false)
    expect(isSynthDepthTestPath('/SC4RWT')).toBe(false)
    expect(isSynthDepthTestPath('/SC4RWT/')).toBe(false)
  })
})
