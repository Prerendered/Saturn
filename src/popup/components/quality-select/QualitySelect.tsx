import type { QualityLevel } from '../../../types'

const QUALITY_OPTIONS: ReadonlyArray<{ label: string; value: QualityLevel }> = [
  { label: '4K — 2160p', value: 'hd2160'  },
  { label: '1440p',      value: 'hd1440'  },
  { label: '1080p',      value: 'hd1080'  },
  { label: '720p',       value: 'hd720'   },
]

interface Props {
  value: QualityLevel | null
  onChange: (quality: QualityLevel) => void
}

export function QualitySelect({ value, onChange }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onChange(e.target.value as QualityLevel)
  }

  return (
    <select
      value={value ?? ''}
      onChange={handleChange}
      style={{
        width: '100%',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        color: 'var(--color-text-secondary)',
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        padding: '6px 8px',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {value === null && (
        <option value="" disabled>
          Pick a quality…
        </option>
      )}
      {QUALITY_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
