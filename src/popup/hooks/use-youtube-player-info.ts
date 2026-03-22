import { useEffect, useState } from 'react'
import type { QualityLevel } from '../../types'

interface UseYouTubePlayerInfoResult {
  availableLevels: QualityLevel[]
}

/**
 * Executes a script in the MAIN world of the active YouTube tab to read
 * getAvailableQualityLevels() from the player. Only runs when tabId is defined
 * and the tab is on youtube.com.
 */
export function useYouTubePlayerInfo(
  isOnYouTube: boolean,
  tabId: number | undefined,
): UseYouTubePlayerInfoResult {
  const [availableLevels, setAvailableLevels] = useState<QualityLevel[]>([])

  useEffect(() => {
    if (!isOnYouTube || tabId === undefined) return

    chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        const player = document.querySelector('#movie_player') as Record<string, unknown> | null
        if (player === null || typeof player['getAvailableQualityLevels'] !== 'function') return []
        return (player['getAvailableQualityLevels'] as () => string[])()
      },
    })
      .then(results => {
        const levels = results[0]?.result
        if (Array.isArray(levels) && levels.length > 0) {
          setAvailableLevels(levels as QualityLevel[])
        }
      })
      .catch(() => undefined)
  }, [isOnYouTube, tabId])

  return { availableLevels }
}
