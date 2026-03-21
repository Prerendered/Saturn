import { detectScreenWidth, detectScreenHeight, formatResolution } from './resolution-readout.utils'

export function ResolutionReadout() {
  const width = detectScreenWidth()
  const height = detectScreenHeight()

  return (
    <span
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        fontWeight: 400,
        color: 'var(--color-text-muted)',
        letterSpacing: '0.02em',
      }}
    >
      {formatResolution(width, height)}
    </span>
  )
}
