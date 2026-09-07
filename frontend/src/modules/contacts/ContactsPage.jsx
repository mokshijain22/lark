import { useEffect, useState } from 'react';
import client from '../../shared/api/client';
import { useAuth } from '../../shared/context/AuthContext';
import PanelLayout from '../../shared/components/PanelLayout';
import Avatar from '../../shared/components/Avatar';
import Badge from '../../shared/components/Badge';
import EmptyState from '../../shared/components/EmptyState';
import { inputStyle } from '../../shared/components/Field';
import { Users } from 'lucide-react';

export default function ContactsPage() {
  const { user, updateUser } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const isPrivileged = ['Owner', 'Admin'].includes(user?.role);

  const load = async (q = '') => {
    const res = await client.get('/contacts', { params: q ? { search: q } : {} });
    setContacts(res.data.data);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const changeRole = async (id, role) => {
    await client.patch(`/contacts/${id}/role`, { role });
    load(search);
    if (selected?._id === id) setSelected({ ...selected, role });
  };

  const uploadAvatar = async (file) => {
    const payload = new FormData();
    payload.append('avatar', file);
    const res = await client.patch('/contacts/me/avatar', payload);
    setSelected(res.data.data);
    updateUser({ avatar: res.data.data.avatar });
    load(search);
  };

  return (
    <PanelLayout
      title="Contacts"
      listContent={
        <div>
          <div style={{ padding: '0 16px 12px' }}>
            <input
              style={inputStyle}
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {contacts.map((c) => (
            <div
              key={c._id}
              onClick={() => setSelected(c)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                cursor: 'pointer',
                background: selected?._id === c._id ? 'var(--color-bg)' : 'transparent',
              }}
            >
              <Avatar name={c.name} src={c.avatar} status={c.status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{c.role}</div>
              </div>
            </div>
          ))}
        </div>
      }
      detailContent={
        selected ? (
          <div style={{ padding: 32, maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <Avatar name={selected.name} src={selected.avatar} size={64} status={selected.status} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{selected.name}</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{selected.email}</div>
                {selected._id === user._id && (
                  <label style={{ display: 'inline-block', marginTop: 6, fontSize: 12, color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>
                    Change photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files[0] && uploadAvatar(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Badge>{selected.role}</Badge>{' '}
              <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
                {selected.status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>

            {isPrivileged && selected._id !== user._id && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Change role
                </label>
                <select
                  style={{ ...inputStyle, marginTop: 6, width: 200 }}
                  value={selected.role}
                  onChange={(e) => changeRole(selected._id, e.target.value)}
                >
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>
            )}
          </div>
        ) : (
          <EmptyState icon={Users} title="Select a contact" subtitle="Choose someone from the directory to view details" />
        )
      }
    />
  );
}
