/**
 * Isolated world content script — runs in Chrome's sandboxed JS context.
 *
 * CAN:  access chrome.* APIs, read chrome.storage.local, receive runtime messages.
 * CANNOT: read JS properties that YouTube attaches to DOM elements at runtime.
 *
 * Responsibility: decide WHEN and WHAT quality to apply, then dispatch a custom
 * window event that the MAIN world script (player-world.ts) can receive and act on.
 */

import type { SaturnMessage } from '../types'
import { getSettings } from '../utils/storage'
import { initSpaObserver } from './spa-observer'
import { detectScreenHeight } from '../utils/resolution'
import { SATURN_APPLY_QUALITY_EVENT } from '../utils/constants'

function isContextValid(): boolean {
  try {
    return typeof chrome.runtime.id === 'string'
  } catch {
    return false
  }
}

async function initPlayerController(): Promise<void> {
  if (!isContextValid()) return

  const settings = await getSettings()
  // Apply if auto mode is on, OR if a manual quality is pinned.
  // Only bail when both are absent (extension is fully disabled).
  if (!settings.enabled && settings.manualQuality === null) return

  const payload = {
    screenHeight: detectScreenHeight(),
    manualQuality: settings.manualQuality,
  }

  // Store payload in a DOM attribute so the MAIN world script can pick it up
  // if it hasn't registered its listener yet (both scripts load asynchronously
  // at document_idle and the order is not guaranteed).
  document.documentElement.dataset.saturnPending = JSON.stringify(payload)

  // Also dispatch the event for the case where MAIN world is already listening.
  window.dispatchEvent(new CustomEvent(SATURN_APPLY_QUALITY_EVENT, { detail: payload }))
}

// ── Initial load ──────────────────────────────────────────────────────────────

initPlayerController()

// ── SPA navigation ────────────────────────────────────────────────────────────

initSpaObserver(() => {
  initPlayerController()
})

// ── Popup message relay ───────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (!isContextValid()) return
  const msg = message as SaturnMessage
  if (msg.type === 'APPLY_QUALITY') {
    initPlayerController()
  }
})
