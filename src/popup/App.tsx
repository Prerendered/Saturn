import { useExtensionSettings } from './hooks/use-extension-settings'
import { LoadingState } from './components/loading-state/LoadingState'
import { Toggle } from './components/toggle/Toggle'
import { StatusPill } from './components/status-pill/StatusPill'
import { ResolutionReadout } from './components/resolution-readout/ResolutionReadout'
import { QualitySelect } from './components/quality-select/QualitySelect'
import { resolveTargetQuality } from '../utils/quality-map'
import { QUALITY_ORDER } from '../utils/constants'
import { detectScreenHeight } from '../utils/resolution'

export function App() {
  const { settings, loading, update } = useExtensionSettings()

  if (loading || settings === null) {
    return <LoadingState />
  }

  return (
    <div style={{
      width: '320px',
      background: 'var(--color-bg)',
      padding: '16px',
      boxSizing: 'border-box',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
        }}>
          Saturn
        </span>
        <StatusPill
          quality={settings.manualQuality ?? resolveTargetQuality(detectScreenHeight(), [...QUALITY_ORDER])}
          active={settings.enabled || settings.manualQuality !== null}
        />
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
        marginBottom: '12px',
      }}>
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            marginBottom: '2px',
          }}>
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
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}>
          Manual Override
        </div>
        <QualitySelect
          value={settings.manualQuality}
          onChange={manualQuality => update({ manualQuality, enabled: false })}
        />
      </div>

      {/* Footer — detected resolution */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        <ResolutionReadout />
      </div>

    </div>
  )
}
