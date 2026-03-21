import { describe, expect, it } from 'bun:test'
import { formatResolution } from './resolution-readout.utils'

describe('formatResolution', () => {
  it('formats a 4K resolution', () => {
    expect(formatResolution(3840, 2160)).toBe('3840 × 2160')
  })

  it('formats a 1440p resolution', () => {
    expect(formatResolution(2560, 1440)).toBe('2560 × 1440')
  })

  it('formats a 1080p resolution', () => {
    expect(formatResolution(1920, 1080)).toBe('1920 × 1080')
  })

  it('formats a non-standard resolution', () => {
    expect(formatResolution(1366, 768)).toBe('1366 × 768')
  })
})
