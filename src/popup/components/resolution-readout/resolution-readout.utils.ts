/**
 * Returns the physical screen width in pixels, accounting for device pixel ratio.
 * Uses screen.width rather than window.innerWidth to get the true hardware resolution.
 */
export function detectScreenWidth(): number {
  return Math.round(screen.width * devicePixelRatio)
}

/**
 * Returns the physical screen height in pixels, accounting for device pixel ratio.
 * This is the value used to select a YouTube quality tier.
 */
export function detectScreenHeight(): number {
  return Math.round(screen.height * devicePixelRatio)
}

/**
 * Formats a physical screen resolution into the display string used by the popup.
 * Example: formatResolution(2560, 1440) → "2560 × 1440"
 */
export function formatResolution(width: number, height: number): string {
  return `${width} × ${height}`
}
