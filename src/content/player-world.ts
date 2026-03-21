/**
 * Runs in the page's MAIN JavaScript world (world: "MAIN" in manifest).
 *
 * Only MAIN world scripts can read JavaScript properties that YouTube attaches
 * to DOM elements at runtime (e.g. getAvailableQualityLevels, setPlaybackQualityRange).
 * Content scripts in the default ISOLATED world share the DOM but not the JS heap,
 * so those methods appear as undefined from an isolated script.
 *
 * This script:
 * - Listens for the SATURN_APPLY_QUALITY_EVENT dispatched by the isolated world script.
 * - Locates the YouTube player element and reads its API.
 * - Applies the requested quality via setPlaybackQualityRange.
 * - Has NO access to chrome.* APIs — Chrome API calls must stay in index.ts.
 */

import type { QualityLevel } from '../types'
import {
  SATURN_APPLY_QUALITY_EVENT,
  PLAYER_RETRY_COUNT,
  PLAYER_RETRY_DELAY_MS,
} from '../utils/constants'
import { resolveTargetQuality } from '../utils/quality-map'

// ── Types ────────────────────────────────────────────────────────────────────

interface ApplyQualityPayload {
  screenHeight: number
  manualQuality: QualityLevel | null
}

interface YouTubePlayerElement extends Element {
  getAvailableQualityLevels(): QualityLevel[]
  setPlaybackQualityRange(min: QualityLevel, max: QualityLevel): void
  getPlaybackQuality(): QualityLevel
}

// ── Player access ─────────────────────────────────────────────────────────────

function getPlayer(): YouTubePlayerElement | null {
  const el =
    document.querySelector('#movie_player') ??
    document.querySelector('.html5-video-player')

  if (el === null) return null

  const player = el as unknown as YouTubePlayerElement
  if (typeof player.getAvailableQualityLevels !== 'function') return null

  return player
}

// ── Quality application ───────────────────────────────────────────────────────

function applyQuality(
  screenHeight: number,
  manualQuality: QualityLevel | null,
  attempt = 0,
): void {
  const player = getPlayer()

  if (player === null) {
    if (attempt < PLAYER_RETRY_COUNT) {
      setTimeout(
        () => applyQuality(screenHeight, manualQuality, attempt + 1),
        PLAYER_RETRY_DELAY_MS * (attempt + 1),
      )
    } else {
      console.warn('[Saturn] Player not found after retries — quality will not be applied')
    }
    return
  }

  try {
    if (manualQuality !== null) {
      player.setPlaybackQualityRange(manualQuality, manualQuality)
      return
    }

    const available = player.getAvailableQualityLevels()

    if (available.length === 0) {
      // Levels not ready yet — retry
      if (attempt < PLAYER_RETRY_COUNT) {
        setTimeout(
          () => applyQuality(screenHeight, manualQuality, attempt + 1),
          PLAYER_RETRY_DELAY_MS * (attempt + 1),
        )
      }
      return
    }

    const target = resolveTargetQuality(screenHeight, available)
    if (target === null) return

    player.setPlaybackQualityRange(target, target)
  } catch (err) {
    console.warn('[Saturn] Failed to apply quality:', err)
  }
}

// ── Init & event listener ─────────────────────────────────────────────────────

// Register listener first, then check for a pending payload that was stored by
// the isolated world script before this script had a chance to register.
// This handles the race condition where both scripts load asynchronously at
// document_idle and the isolated world dispatches before we are listening.

window.addEventListener(SATURN_APPLY_QUALITY_EVENT, (event: Event) => {
  // Clear the pending attribute — we received the live event, no need to apply twice.
  delete document.documentElement.dataset.saturnPending
  const { screenHeight, manualQuality } = (event as CustomEvent<ApplyQualityPayload>).detail
  applyQuality(screenHeight, manualQuality)
})

// Drain any pending quality that arrived before our listener was registered.
const pendingRaw = document.documentElement.dataset.saturnPending
if (pendingRaw !== undefined) {
  delete document.documentElement.dataset.saturnPending
  try {
    const payload = JSON.parse(pendingRaw) as ApplyQualityPayload
    applyQuality(payload.screenHeight, payload.manualQuality)
  } catch {
    console.warn('[Saturn] Failed to parse pending quality payload')
  }
}
