import type { YouTubePlayer } from '../types'
import { PLAYER_RETRY_COUNT, PLAYER_RETRY_DELAY_MS } from '../utils/constants'
import { resolveTargetQuality } from '../utils/quality-map'

/**
 * Attempts to locate the YouTube HTML5 player element, retrying with
 * exponential backoff if it is not yet present in the DOM.
 *
 * Validates that the player exposes getAvailableQualityLevels — if YouTube
 * updates break the player object, this check catches it early.
 *
 * @returns The player object, or null after all retries are exhausted.
 */
export async function findPlayerWithRetry(): Promise<YouTubePlayer | null> {
  for (let attempt = 0; attempt <= PLAYER_RETRY_COUNT; attempt++) {
    const el = document.querySelector('.html5-video-player')

    if (el !== null && typeof (el as unknown as YouTubePlayer).getAvailableQualityLevels === 'function') {
      return el as unknown as YouTubePlayer
    }

    if (attempt < PLAYER_RETRY_COUNT) {
      await new Promise<void>(resolve =>
        setTimeout(resolve, PLAYER_RETRY_DELAY_MS * (attempt + 1))
      )
    }
  }

  console.warn('[Saturn] Player not found after retries — quality will not be applied')
  return null
}

/**
 * Resolves and applies the optimal playback quality for the given screen height.
 *
 * Pipeline:
 * 1. Fetch available quality levels from the player.
 * 2. Resolve the highest quality the screen can display.
 * 3. Lock playback to that quality via setPlaybackQualityRange.
 *
 * Degrades gracefully on every failure path:
 * - Empty available list → bail silently.
 * - No matching quality tier → bail silently.
 * - Player API throws → log with [Saturn] prefix, never rethrow.
 */
export function applyQuality(player: YouTubePlayer, screenHeight: number): void {
  try {
    const available = player.getAvailableQualityLevels()
    if (available.length === 0) return

    const target = resolveTargetQuality(screenHeight, available)
    if (target === null) return

    player.setPlaybackQualityRange(target, target)
  } catch (err) {
    console.warn('[Saturn] Failed to apply quality:', err)
  }
}
