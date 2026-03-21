import type { SaturnMessage } from '../types'
import { getSettings } from '../utils/storage'
import { findPlayerWithRetry } from './player-controller'
import { applyQuality } from './player-controller'
import { initSpaObserver } from './spa-observer'
import { detectScreenHeight } from '../utils/resolution'

/**
 * Finds the player and applies quality if the extension is enabled.
 * Safe to call on initial load and on every SPA navigation.
 */
async function initPlayerController(): Promise<void> {
  const settings = await getSettings()
  if (!settings.enabled) return

  const player = await findPlayerWithRetry()
  if (player === null) return

  applyQuality(player, detectScreenHeight())
}

// ── Initial load ────────────────────────────────────────────────────────────

initPlayerController()

// ── SPA navigation ──────────────────────────────────────────────────────────

initSpaObserver(() => {
  initPlayerController()
})

// ── Popup message relay ─────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as SaturnMessage
  if (msg.type === 'APPLY_QUALITY') {
    initPlayerController()
  }
})
