import type { QualityLevel } from '../types'
import { QUALITY_ORDER, QUALITY_THRESHOLDS } from './constants'

/**
 * Resolves the highest quality level that is both available on the video
 * and supported by the screen.
 *
 * Rules:
 * - The screen must meet or exceed the quality tier's minimum height threshold.
 * - The quality must appear in the available list returned by the player.
 * - Returns null when the available list is empty.
 *
 * @param screenHeight - Physical screen height in pixels (screen.height × devicePixelRatio)
 * @param available    - Quality levels the current video supports, highest to lowest
 */
export function resolveTargetQuality(
  screenHeight: number,
  available: readonly QualityLevel[],
): QualityLevel | null {
  if (available.length === 0) return null

  const availableSet = new Set<string>(available)

  for (const quality of QUALITY_ORDER) {
    const threshold = QUALITY_THRESHOLDS[quality]
    if (screenHeight >= threshold && availableSet.has(quality)) {
      return quality
    }
  }

  // Screen is below all thresholds — return the lowest available quality.
  const last = available[available.length - 1]
  return last ?? null
}
