import { SPA_NAV_DEBOUNCE_DELAY_MS } from '../utils/constants'

/**
 * Watches #page-manager for YouTube SPA navigations and calls the provided
 * callback after each one, debounced to let the new player settle in the DOM.
 *
 * Uses MutationObserver — never popstate or history events, which YouTube
 * overrides internally and which fire before the player is ready.
 *
 * @param onNavigate - Called after each SPA navigation once the debounce resolves.
 * @returns The active MutationObserver so the caller can disconnect it if needed.
 */
export function initSpaObserver(onNavigate: () => void): MutationObserver {
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(onNavigate, SPA_NAV_DEBOUNCE_DELAY_MS)
  })

  const pageManager = document.querySelector('#page-manager')

  if (pageManager === null) {
    console.warn('[Saturn] #page-manager not found — SPA observer not started')
    return observer
  }

  observer.observe(pageManager, { childList: true, subtree: false })

  return observer
}
