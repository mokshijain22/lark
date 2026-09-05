export default function PanelLayout({ title, headerActions, listContent, detailContent, children }) {
  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
      {children}
      <div
        style={{
          width: 320,
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-surface)',
        }}
      >
        <div
          style={{
            padding: '18px 16px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>
          {headerActions}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>{listContent}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg)' }}>{detailContent}</div>
    </div>
  );
}
