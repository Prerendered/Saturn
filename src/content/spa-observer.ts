/**
 * Listens for YouTube's internal `yt-navigate-finish` document event, which
 * fires after each SPA navigation once the new page — including the player —
 * has been rendered into the DOM.
 *
 * This is more reliable than MutationObserver on #page-manager, which fires
 * as soon as the DOM node appears but before the player API is attached.
 *
 * Falls back to a MutationObserver on #page-manager for YouTube layouts that
 * do not dispatch the custom event.
 *
 * @param onNavigate - Called after each SPA navigation.
 */
export function initSpaObserver(onNavigate: () => void): void {
  // Primary: YouTube's own post-navigation event. Fires after the player is ready.
  document.addEventListener('yt-navigate-finish', () => {
    onNavigate()
  })

  // Fallback: watch #page-manager child swaps for layouts that skip the event.
  const pageManager = document.querySelector('#page-manager')
  if (pageManager === null) return

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(onNavigate, 800)
  })

  observer.observe(pageManager, { childList: true, subtree: false })
}
