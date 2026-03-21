import { describe, expect, it } from 'bun:test'
import { getTrackColor, getBorderColor } from './toggle.utils'

describe('getTrackColor', () => {
  it('returns accent when enabled regardless of hover', () => {
    expect(getTrackColor(true, false)).toBe('var(--color-accent)')
    expect(getTrackColor(true, true)).toBe('var(--color-accent)')
  })

  it('returns border-hover when disabled and hovered', () => {
    expect(getTrackColor(false, true)).toBe('var(--color-border-hover)')
  })

  it('returns surface-raised when disabled and not hovered', () => {
    expect(getTrackColor(false, false)).toBe('var(--color-surface-raised)')
  })
})

describe('getBorderColor', () => {
  it('returns accent-border when enabled regardless of hover', () => {
    expect(getBorderColor(true, false)).toBe('var(--color-accent-border)')
    expect(getBorderColor(true, true)).toBe('var(--color-accent-border)')
  })

  it('returns border-hover when disabled and hovered', () => {
    expect(getBorderColor(false, true)).toBe('var(--color-border-hover)')
  })

  it('returns border when disabled and not hovered', () => {
    expect(getBorderColor(false, false)).toBe('var(--color-border)')
  })
})
