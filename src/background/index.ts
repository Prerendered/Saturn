import type { SaturnMessage } from '../types'
import { getSettings, saveSettings } from '../utils/storage'
import { BADGE_BG_COLOR, BADGE_LABEL_MAP } from '../utils/constants'

/**
 * On first install, write defaults to storage so every other part of the
 * extension can read settings without handling a missing-key case.
 * On update, existing settings are preserved — getSettings() merges with
 * defaults at read time, so no migration is needed here.
 */
/**
 * Relays APPLY_QUALITY from the popup to the content script on the active tab.
 * Handles SET_BADGE / CLEAR_BADGE from the content script to update the
 * toolbar badge for the tab that sent the message.
 */
chrome.runtime.onMessage.addListener((message: unknown, sender) => {
  const msg = message as SaturnMessage

  if (msg.type === 'APPLY_QUALITY') {
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(([tab]) => {
        if (tab?.id === undefined) return
        return chrome.tabs.sendMessage(tab.id, msg).catch(() => undefined)
      })
      .catch(() => {
        console.warn('[Saturn] Background relay failed for APPLY_QUALITY')
      })
    return
  }

  const tabId = sender.tab?.id
  if (tabId === undefined) return

  if (msg.type === 'SET_BADGE') {
    if (msg.show) {
      chrome.action.setBadgeText({ text: BADGE_LABEL_MAP[msg.quality], tabId }).catch(() => undefined)
      chrome.action.setBadgeBackgroundColor({ color: BADGE_BG_COLOR, tabId }).catch(() => undefined)
    } else {
      chrome.action.setBadgeText({ text: '', tabId }).catch(() => undefined)
    }
    return
  }

  if (msg.type === 'CLEAR_BADGE') {
    chrome.action.setBadgeText({ text: '', tabId }).catch(() => undefined)
  }
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
