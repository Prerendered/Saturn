import { useExtensionSettings } from './hooks/use-extension-settings'
import { LoadingState } from './components/loading-state/LoadingState'
import { Toggle } from './components/toggle/Toggle'
import { StatusPill } from './components/status-pill/StatusPill'
import { ResolutionReadout } from './components/resolution-readout/ResolutionReadout'

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
        <StatusPill quality={null} active={false} />
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
        marginBottom: '16px',
      }}>
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            marginBottom: '2px',
          }}>
            Auto quality
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
            Set highest quality on every video
          </div>
        </div>
        <Toggle
          enabled={settings.enabled}
          onToggle={enabled => update({ enabled })}
          label="Enable auto quality"
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
