// Single source of truth for all behavioural constants.
// Design tokens (colours, fonts) live in tokens.ts — not here.
// When you need to change a number or a key, this is the only file you open.

// ─── Player ────────────────────────────────────────────────────────────────

/** How many times to retry finding the YouTube player before giving up. */
export const PLAYER_RETRY_COUNT = 5 as const

/** Base delay (ms) between player lookup retries. Multiplied by attempt index for linear backoff. */
export const PLAYER_RETRY_DELAY_MS = 500 as const

// ─── Quality ───────────────────────────────────────────────────────────────

/**
 * Canonical YouTube quality strings, ordered highest to lowest.
 * Never redefine these elsewhere — always import from here.
 */
export const QUALITY_ORDER = [
  'hd2160',
  'hd1440',
  'hd1080',
  'hd720',
  'large',
  'medium',
  'small',
  'tiny',
] as const

/**
 * Minimum physical screen height (px) required to target each quality level.
 * A monitor must meet or exceed this height (after devicePixelRatio scaling) to use the tier.
 */
export const QUALITY_THRESHOLDS = {
  hd2160: 2160,
  hd1440: 1440,
  hd1080: 1080,
  hd720:  720,
  large:  480,
  medium: 360,
  small:  240,
  tiny:   0,
} as const

// ─── Storage ───────────────────────────────────────────────────────────────

/** chrome.storage.local key under which extension settings are persisted. */
export const STORAGE_KEY_SETTINGS = 'settings' as const

// ─── Popup ─────────────────────────────────────────────────────────────────

/** Chrome popup width constraint (px). Hard browser limit — never change. */
export const POPUP_WIDTH_PX = 320 as const

/** Standard horizontal padding (px) for popup content areas. */
export const POPUP_PADDING_PX = 16 as const

/** Standard vertical padding (px) for popup content areas. */
export const POPUP_PADDING_VERTICAL_PX = 12 as const

/** Gap (px) between logical section groups in the popup layout. */
export const POPUP_SECTION_GAP_PX = 16 as const

// ─── Cross-world Messaging ─────────────────────────────────────────────────

/**
 * Custom window event name used to pass quality instructions from the isolated
 * world content script to the MAIN world player script.
 * Both scripts are bundled separately so they share this constant via import.
 */
export const SATURN_APPLY_QUALITY_EVENT = 'saturn:apply-quality' as const

// ─── SPA Navigation ────────────────────────────────────────────────────────

/**
 * Delay (ms) after a YouTube SPA navigation before attempting to access the player.
 * YouTube needs time to inject the new player into the DOM after a route change.
 */
export const SPA_NAV_DEBOUNCE_DELAY_MS = 500 as const
