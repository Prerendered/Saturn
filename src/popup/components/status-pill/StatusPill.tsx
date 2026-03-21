import type { QualityLevel } from '../../../types'

interface Props {
  /** The quality level currently active, or null when unknown. */
  quality: QualityLevel | null
  /** Whether Saturn successfully applied the quality on the current video. */
  active: boolean
}

export function StatusPill({ quality, active }: Props) {
  if (!quality) return null

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '6px',
        background: 'var(--color-accent-dim)',
        border: '1px solid var(--color-accent-border)',
        color: 'var(--color-accent)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        fontWeight: 500,
        boxShadow: active ? '0 0 8px var(--color-accent-glow)' : 'none',
        transition: 'box-shadow 200ms ease',
      }}
    >
      {quality}
    </span>
  )
}
