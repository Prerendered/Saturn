import { useEffect, useState } from 'react'

interface UseActiveTabResult {
  isOnYouTube: boolean
  tabId: number | undefined
}

/**
 * Queries the active tab once on mount and returns whether it is on youtube.com
 * and its tab ID (needed for scripting API calls).
 * Relies on the activeTab permission granted when the popup opens.
 */
export function useActiveTab(): UseActiveTabResult {
  const [isOnYouTube, setIsOnYouTube] = useState(false)
  const [tabId, setTabId] = useState<number | undefined>(undefined)

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      setIsOnYouTube(tab?.url?.includes('youtube.com') ?? false)
      setTabId(tab?.id)
    })
  }, [])

  return { isOnYouTube, tabId }
}
