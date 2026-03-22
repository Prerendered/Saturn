import { useState } from 'react'
import { useExtensionSettings } from './hooks/use-extension-settings'
import { useActiveTab } from './hooks/use-active-tab'
import { useYouTubePlayerInfo } from './hooks/use-youtube-player-info'
import { LoadingState } from './components/loading-state/LoadingState'
import { Toggle } from './components/toggle/Toggle'
import { StatusPill } from './components/status-pill/StatusPill'
import { QualitySelect } from './components/quality-select/QualitySelect'
import { ResolutionReadout } from './components/resolution-readout/ResolutionReadout'
import { resolveTargetQuality } from '../utils/quality-map'
import { QUALITY_ORDER, YOUTUBE_BADGE_RED } from '../utils/constants'
import { detectScreenHeight } from '../utils/resolution'

type View = 'main' | 'settings'

export function App() {
  const { settings, loading, update } = useExtensionSettings()
  const { isOnYouTube, tabId } = useActiveTab()
  const { availableLevels } = useYouTubePlayerInfo(isOnYouTube, tabId)
  const [view, setView] = useState<View>('main')
  const [settingsHovered, setSettingsHovered] = useState(false)

  if (loading || settings === null) {
    return <LoadingState />
  }

  const shell = (children: React.ReactNode, footer: React.ReactNode) => (
    <div style={{
      width: '320px',
      background: 'var(--color-bg)',
      padding: '16px',
      boxSizing: 'border-box',
      fontFamily: 'Inter, sans-serif',
      border: '0.5px solid rgba(167,139,250,0.18)',
      overflow: 'hidden',
    }}>
      {children}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '0.5px solid rgba(167,139,250,0.08)',
        paddingTop: '10px',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
          Saturn. by Planets.
        </span>
        {footer}
      </div>
    </div>
  )

  // ── Settings view ──────────────────────────────────────────────────────────

  if (view === 'settings') {
    return shell(
      <>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Settings
          </span>
        </div>

        {/* showBadge toggle row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderRadius: '8px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          marginBottom: '16px',
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
              Show badge
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
              Display active quality on the toolbar icon
            </div>
          </div>
          <Toggle
            enabled={settings.showBadge}
            onToggle={showBadge => update({ showBadge })}
            label="Show quality badge"
          />
        </div>
      </>,
      <button
        onClick={() => setView('main')}
        onMouseEnter={() => setSettingsHovered(true)}
        onMouseLeave={() => setSettingsHovered(false)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontSize: '10px',
          color: settingsHovered ? '#a78bfa' : 'rgba(167,139,250,0.5)',
          fontFamily: 'Inter, sans-serif',
          transition: 'color 150ms ease',
        }}
      >
        ← Back
      </button>,
    )
  }

  // ── Main view ──────────────────────────────────────────────────────────────

  const isOff = !settings.enabled && settings.manualQuality === null

  return shell(
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <img src="/icons/png/saturn-planet-48.png" width="22" height="22" alt="" aria-hidden="true" />
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Saturn<span style={{ color: isOff ? '#4a4870' : 'rgba(167,139,250,0.6)' }}>.</span>
        </span>
      </div>

      {/* Status bar strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '0 -16px',
        padding: '8px 16px',
        background: 'rgba(167,139,250,0.07)',
        borderBottom: '0.5px solid rgba(167,139,250,0.10)',
        marginBottom: '12px',
      }}>
        {/* Left zone — active quality */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
          }}>
            Active Quality
          </span>
          <StatusPill
            quality={isOff ? null : (settings.manualQuality ?? resolveTargetQuality(detectScreenHeight(), [...QUALITY_ORDER]))}
            active={settings.enabled || settings.manualQuality !== null}
          />
        </div>
        {/* Right zone — screen resolution */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
          }}>
            Screen
          </span>
          <ResolutionReadout />
        </div>
      </div>

      {/* Enable toggle row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderRadius: '8px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        marginBottom: '0',
      }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
            Auto-resolution
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
            Set highest quality on every video
          </div>
        </div>
        <Toggle
          enabled={settings.enabled}
          onToggle={enabled => update({ enabled, ...(enabled ? { manualQuality: null } : {}) })}
          label="Enable auto quality"
        />
      </div>

      <div style={{ borderTop: '0.5px solid rgba(167,139,250,0.08)', margin: '12px 0' }} />

      {/* On YouTube tab row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
          On YouTube tab
        </span>
        {isOnYouTube && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
              <rect width="8" height="8" rx="1" fill={YOUTUBE_BADGE_RED} />
              <polygon points="2,1.5 2,6.5 6.5,4" fill="white" />
            </svg>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              youtube.com
            </span>
          </div>
        )}
      </div>

      {/* Manual override — slides in when auto is off */}
      <div style={{
        overflow: 'hidden',
        maxHeight: settings.enabled ? '0' : '80px',
        opacity: settings.enabled ? 0 : 1,
        marginBottom: settings.enabled ? '0' : '16px',
        transition: 'max-height 0.25s ease, opacity 0.2s ease, margin-bottom 0.25s ease',
        pointerEvents: settings.enabled ? 'none' : 'auto',
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}>
          Manual Override
        </div>
        <QualitySelect
          value={settings.manualQuality}
          disabled={settings.manualQuality === null}
          onChange={manualQuality => update({ manualQuality, enabled: false })}
        />
      </div>

      <div style={{ borderTop: '0.5px solid rgba(167,139,250,0.08)', margin: '12px 0' }} />

      {/* Info rows */}
      <div style={{ marginBottom: '12px' }}>
        {([
          ['Physical height', `${detectScreenHeight()}px`],
          ['Device pixel ratio', `${devicePixelRatio.toFixed(1)}×`],
          ['Available levels', availableLevels.length > 0 ? availableLevels.join(', ') : '—'],
        ] as const).map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{label}</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{value}</span>
          </div>
        ))}
      </div>
    </>,
    <>
      <button
        onClick={() => setView('settings')}
        onMouseEnter={() => setSettingsHovered(true)}
        onMouseLeave={() => setSettingsHovered(false)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontSize: '10px',
          color: settingsHovered ? '#a78bfa' : 'rgba(167,139,250,0.5)',
          fontFamily: 'Inter, sans-serif',
          transition: 'color 150ms ease',
        }}
      >
        Settings
      </button>
    </>,
  )
}
