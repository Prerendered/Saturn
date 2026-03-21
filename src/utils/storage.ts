import type { ExtensionSettings } from '../types'
import { STORAGE_KEY_SETTINGS } from './constants'

const DEFAULTS: ExtensionSettings = {
  enabled: true,
  showBadge: true,
  manualQuality: null,
}

/**
 * Reads extension settings from chrome.storage.local.
 * Always merges with defaults so missing keys never cause undefined access.
 */
export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEY_SETTINGS)
  const stored = result[STORAGE_KEY_SETTINGS] as Partial<ExtensionSettings> | undefined
  return { ...DEFAULTS, ...stored }
}

/**
 * Persists extension settings to chrome.storage.local.
 */
export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: settings })
}
