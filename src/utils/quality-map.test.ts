import { describe, expect, it } from 'bun:test'
import { resolveTargetQuality } from './quality-map'

describe('resolveTargetQuality', () => {
  it('returns null for an empty available list', () => {
    expect(resolveTargetQuality(2160, [])).toBeNull()
  })

  it('returns hd2160 for a 4K screen with hd2160 available', () => {
    expect(resolveTargetQuality(2160, ['hd2160', 'hd1440', 'hd1080'])).toBe('hd2160')
  })

  it('clamps to highest available when preferred tier is not in the list', () => {
    expect(resolveTargetQuality(2160, ['hd1440', 'hd1080', 'hd720'])).toBe('hd1440')
  })

  it('returns hd1080 for a 1080p screen', () => {
    expect(resolveTargetQuality(1080, ['hd2160', 'hd1440', 'hd1080', 'hd720'])).toBe('hd1080')
  })

  it('returns hd720 for a 720p screen', () => {
    expect(resolveTargetQuality(720, ['hd2160', 'hd1440', 'hd1080', 'hd720', 'large'])).toBe('hd720')
  })

  it('returns large for a 480p screen', () => {
    expect(resolveTargetQuality(480, ['hd1080', 'hd720', 'large', 'medium'])).toBe('large')
  })

  it('falls back to highest available when screen is below all thresholds', () => {
    expect(resolveTargetQuality(100, ['hd1080', 'hd720'])).toBe('hd1080')
  })

  it('returns the only available quality regardless of screen size', () => {
    expect(resolveTargetQuality(2160, ['medium'])).toBe('medium')
  })
})
