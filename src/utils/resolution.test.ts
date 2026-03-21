import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { detectScreenHeight } from './resolution'

function mockScreenGlobals(height: number, dpr: number): void {
  Object.defineProperty(globalThis, 'screen', {
    value: { height },
    configurable: true,
    writable: true,
  })
  Object.defineProperty(globalThis, 'devicePixelRatio', {
    value: dpr,
    configurable: true,
    writable: true,
  })
}

const originalScreen = globalThis.screen
const originalDpr = globalThis.devicePixelRatio

beforeEach(() => {
  // Ensure a clean slate before each test
  mockScreenGlobals(0, 1)
})

afterEach(() => {
  Object.defineProperty(globalThis, 'screen', {
    value: originalScreen,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(globalThis, 'devicePixelRatio', {
    value: originalDpr,
    configurable: true,
    writable: true,
  })
})

describe('detectScreenHeight', () => {
  it('returns screen.height as-is at standard DPR (1×)', () => {
    mockScreenGlobals(1080, 1)
    expect(detectScreenHeight()).toBe(1080)
  })

  it('doubles screen.height at HiDPI DPR (2×)', () => {
    mockScreenGlobals(1080, 2)
    expect(detectScreenHeight()).toBe(2160)
  })

  it('rounds fractional results from non-integer DPR (1.5×)', () => {
    mockScreenGlobals(1080, 1.5)
    expect(detectScreenHeight()).toBe(1620)
  })

  it('handles 4K screen at 1× DPR', () => {
    mockScreenGlobals(2160, 1)
    expect(detectScreenHeight()).toBe(2160)
  })
})
