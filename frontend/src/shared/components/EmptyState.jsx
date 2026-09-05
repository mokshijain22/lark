export default function EmptyState({ icon = '📭', title, subtitle }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--color-text-muted)',
        gap: 6,
      }}
    >
      <div style={{ fontSize: 32 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13 }}>{subtitle}</div>}
    </div>
  );
}
