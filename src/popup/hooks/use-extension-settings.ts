import { useEffect, useState } from 'react'
import type { ExtensionSettings, SaturnMessage } from '../../types'
import { getSettings, saveSettings } from '../../utils/storage'

interface UseExtensionSettingsResult {
  settings: ExtensionSettings | null
  loading: boolean
  update: (partial: Partial<ExtensionSettings>) => Promise<void>
}

/**
 * Sends an APPLY_QUALITY message to the content script on the active YouTube
 * tab so it immediately re-evaluates quality after a settings change.
 * Wrapped in try/catch — sendMessage throws if no content script is listening
 * (e.g. the tab is not on YouTube, or the extension was just installed).
 */
async function relayToActiveTab(message: SaturnMessage): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id === undefined) return
  // sendMessage throws if no content script is listening — safe to ignore.
  await chrome.tabs.sendMessage(tab.id, message).catch(() => undefined)
}

export function useExtensionSettings(): UseExtensionSettingsResult {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s)
      setLoading(false)
    })
  }, [])

  const update = async (partial: Partial<ExtensionSettings>): Promise<void> => {
    if (settings === null) return
    const updated = { ...settings, ...partial }
    setSettings(updated)        // optimistic — update UI immediately
    await saveSettings(updated) // persist to chrome.storage.local
    await relayToActiveTab({ type: 'APPLY_QUALITY' })
  }

  return { settings, loading, update }
}
