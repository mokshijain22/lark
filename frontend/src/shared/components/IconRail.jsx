import { NavLink } from 'react-router-dom';
import {
  Home, Users, CheckSquare, Calendar, ListTodo, FileText, Database,
  Table2, Presentation, Target, Clock, Mail, StickyNote, Share2, Zap,
  Languages, Plug, Bell, Sun, Moon, LogOut,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import NotificationBell from './NotificationBell';

const modules = [
  { path: '/workplace', label: 'Home', Icon: Home },
  { path: '/contacts', label: 'Contacts', Icon: Users },
  { path: '/approvals', label: 'Approvals', Icon: CheckSquare },
  { path: '/calendar', label: 'Calendar', Icon: Calendar },
  { path: '/tasks', label: 'Tasks', Icon: ListTodo },
  { path: '/docs', label: 'Docs', Icon: FileText },
  { path: '/base', label: 'Base', Icon: Database },
  { path: '/sheets', label: 'Sheets', Icon: Table2 },
  { path: '/slides', label: 'Slides', Icon: Presentation },
  { path: '/okr', label: 'OKR', Icon: Target },
  { path: '/attendance', label: 'Attendance', Icon: Clock },
  { path: '/mail', label: 'Mail', Icon: Mail },
  { path: '/minutes', label: 'Minutes', Icon: StickyNote },
  { path: '/share', label: 'Shared', Icon: Share2 },
  { path: '/anycross', label: 'Anycross', Icon: Zap },
  { path: '/translation', label: 'Translation', Icon: Languages },
  { path: '/integrations', label: 'Integrations', Icon: Plug },
];

export default function IconRail() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <nav
      style={{
        width: 232,
        flexShrink: 0,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      {/* Brand + user */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14, color: 'var(--color-text)' }}>
          Nook
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={user?.name} src={user?.avatar} size={34} status="online" />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{user?.role}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
        {modules.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              marginBottom: 2,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              background: isActive ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent',
              transition: 'background 0.12s, color 0.12s',
            })}
          >
            <Icon size={17} strokeWidth={2} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px', borderTop: '1px solid var(--color-border)' }}>
        <NotificationBell />
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          style={{
            width: 34, height: 34, borderRadius: 8, border: '1px solid var(--color-border)',
            background: 'var(--color-bg)', color: 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button
          onClick={logout}
          title="Logout"
          style={{
            width: 34, height: 34, borderRadius: 8, border: '1px solid var(--color-border)',
            background: 'var(--color-bg)', color: 'var(--color-danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto',
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}