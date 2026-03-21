export function LoadingState() {
  return (
    <div style={{
      width: '320px',
      height: '80px',
      background: 'var(--color-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span className="spinner" />
    </div>
  )
}
