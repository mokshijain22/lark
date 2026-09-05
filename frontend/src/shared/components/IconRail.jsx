import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import NotificationBell from './NotificationBell';

const modules = [
  { path: '/workplace', label: 'Home', icon: '🏠' },
  { path: '/contacts', label: 'Contacts', icon: '👤' },
  { path: '/approvals', label: 'Approvals', icon: '✓' },
  { path: '/calendar', label: 'Calendar', icon: '📅' },
  { path: '/tasks', label: 'Tasks', icon: '☰' },
  { path: '/docs', label: 'Docs', icon: '📄' },
  { path: '/base', label: 'Base', icon: '🗂️' },
  { path: '/sheets', label: 'Sheets', icon: '📊' },
  { path: '/slides', label: 'Slides', icon: '🖥️' },
  { path: '/okr', label: 'OKR', icon: '🎯' },
  { path: '/attendance', label: 'Attendance', icon: '🕒' },
  { path: '/mail', label: 'Mail', icon: '✉️' },
  { path: '/minutes', label: 'Minutes', icon: '📝' },
  { path: '/share', label: 'Shared', icon: '🔗' },
  { path: '/anycross', label: 'Anycross', icon: '⚡' },
  { path: '/integrations', label: 'Integrations', icon: '🔌' },
];

export default function IconRail() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <nav
      style={{
        width: 64,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        gap: 8,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Avatar name={user?.name} src={user?.avatar} size={36} status="online" />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
        {modules.map((m) => (
          <NavLink
            key={m.path}
            to={m.path}
            title={m.label}
            style={({ isActive }) => ({
              width: 40,
              height: 40,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius)',
              fontSize: 17,
              background: isActive ? 'var(--color-primary)' : 'transparent',
              color: isActive ? '#fff' : 'var(--color-text-muted)',
              transition: 'background 0.15s',
            })}
          >
            {m.icon}
          </NavLink>
        ))}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <NotificationBell />
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
          }}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button
          onClick={logout}
          title="Logout"
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            color: 'var(--color-danger)',
          }}
        >
          ⏻
        </button>
      </div>
    </nav>
  );
}
