import { useState } from 'react'
import { getTrackColor, getBorderColor } from './toggle.utils'

interface Props {
  enabled: boolean
  onToggle: (value: boolean) => void
  label: string
}

export function Toggle({ enabled, onToggle, label }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onToggle(!enabled)}
      style={{
        background: getTrackColor(enabled, hovered),
        border: `1px solid ${getBorderColor(enabled, hovered)}`,
        borderRadius: '12px',
        width: '36px',
        height: '20px',
        cursor: 'pointer',
        transition: 'background 150ms ease, border-color 150ms ease',
        position: 'relative',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: enabled ? '18px' : '2px',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: 'white',
          transition: 'left 150ms ease',
          display: 'block',
        }}
      />
    </button>
  )
}
