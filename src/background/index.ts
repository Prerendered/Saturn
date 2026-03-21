import type { SaturnMessage } from '../types'
import { getSettings, saveSettings } from '../utils/storage'

/**
 * On first install, write defaults to storage so every other part of the
 * extension can read settings without handling a missing-key case.
 * On update, existing settings are preserved — getSettings() merges with
 * defaults at read time, so no migration is needed here.
 */
/**
 * Relays APPLY_QUALITY from the popup to the content script on the active tab.
 * The popup sends via chrome.runtime.sendMessage; the background queries the
 * active tab and forwards via chrome.tabs.sendMessage.
 * Wrapped in try/catch — the active tab may not be on YouTube or the content
 * script may not yet be injected.
 */
chrome.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as SaturnMessage
  if (msg.type !== 'APPLY_QUALITY') return

  chrome.tabs
    .query({ active: true, currentWindow: true })
    .then(([tab]) => {
      if (tab?.id === undefined) return
      return chrome.tabs.sendMessage(tab.id, msg).catch(() => undefined)
    })
    .catch(() => {
      console.warn('[Saturn] Background relay failed for APPLY_QUALITY')
    })
})

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason !== 'install') return

  try {
    const settings = await getSettings()
    await saveSettings(settings)
  } catch (err) {
    console.warn('[Saturn] Failed to initialise default settings:', err)
  }
})
