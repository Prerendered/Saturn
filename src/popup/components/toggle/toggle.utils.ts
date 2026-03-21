/**
 * Returns the CSS custom property value for the toggle track background.
 * Enabled takes priority over hovered.
 */
export function getTrackColor(enabled: boolean, hovered: boolean): string {
  if (enabled) return 'var(--color-accent)'
  if (hovered) return 'var(--color-border-hover)'
  return 'var(--color-surface-raised)'
}

/**
 * Returns the CSS custom property value for the toggle border colour.
 * Enabled takes priority over hovered.
 */
export function getBorderColor(enabled: boolean, hovered: boolean): string {
  if (enabled) return 'var(--color-accent-border)'
  if (hovered) return 'var(--color-border-hover)'
  return 'var(--color-border)'
}
