import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';

const timeAgo = (date) => {
  const diffMin = Math.floor((Date.now() - new Date(date)) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
};

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        style={{
          width: 40, height: 40, borderRadius: 'var(--radius)', border: '1px solid var(--color-border)',
          background: 'var(--color-bg)', color: 'var(--color-text)', position: 'relative', fontSize: 17,
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, background: 'var(--color-danger)', color: '#fff',
            fontSize: 10, fontWeight: 700, borderRadius: 10, minWidth: 16, height: 16, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '0 3px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 0, left: 48, width: 320, maxHeight: 420, overflowY: 'auto',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12,
          boxShadow: '0 12px 32px rgba(0,0,0,0.2)', zIndex: 50,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 12, fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>No notifications yet</div>
          )}
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markAsRead(n._id)}
              style={{
                padding: '12px 16px', borderBottom: '1px solid var(--color-border)', cursor: n.isRead ? 'default' : 'pointer',
                background: n.isRead ? 'transparent' : 'var(--color-bg)',
              }}
            >
              <div style={{ fontSize: 13, lineHeight: 1.4 }}>{n.message}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
