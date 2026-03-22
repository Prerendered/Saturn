import type { QualityLevel } from '../../../types'

interface Props {
  /** The quality level currently active, or null when unknown. */
  quality: QualityLevel | null
  /** Whether Saturn successfully applied the quality on the current video. */
  active: boolean
}

export function StatusPill({ quality, active }: Props) {
  const isOff = quality === null

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        borderRadius: '6px',
        background: isOff ? 'var(--color-surface)' : 'var(--color-accent-dim)',
        border: `1px solid ${isOff ? 'var(--color-border)' : 'var(--color-accent-border)'}`,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12px',
        fontWeight: 500,
        boxShadow: active && !isOff ? '0 0 8px var(--color-accent-glow)' : 'none',
        transition: 'background 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
      }}
    >
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: isOff ? 'var(--color-text-muted)' : 'var(--color-accent)',
        flexShrink: 0,
        transition: 'background 200ms ease',
      }} />
      <span style={{ color: isOff ? 'var(--color-text-muted)' : 'var(--color-accent)' }}>
        {isOff ? 'off' : quality}
      </span>
    </span>
  )
}
