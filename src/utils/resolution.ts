/**
 * Returns the physical screen height in pixels, accounting for device pixel ratio.
 * This is the canonical value used to select a YouTube quality tier.
 */
export function detectScreenHeight(): number {
  return Math.round(screen.height * devicePixelRatio)
}

/**
 * Returns the physical screen width in pixels, accounting for device pixel ratio.
 */
export function detectScreenWidth(): number {
  return Math.round(screen.width * devicePixelRatio)
}
