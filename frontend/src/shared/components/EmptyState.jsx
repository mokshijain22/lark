import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, subtitle }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--color-text-muted)',
        gap: 10,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12, background: 'var(--color-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 260 }}>{subtitle}</div>}
    </div>
  );
}