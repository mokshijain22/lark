import { useEffect, useState } from 'react';
import client from '../../shared/api/client';
import { useAuth } from '../../shared/context/AuthContext';
import Button from '../../shared/components/Button';
import { inputStyle } from '../../shared/components/Field';

export default function WorkplacePage() {
  const { user } = useAuth();
  const [page, setPage] = useState(null);
  const [editing, setEditing] = useState(false);
  const isPrivileged = ['Owner', 'Admin'].includes(user?.role);

  const load = async () => {
    const res = await client.get('/workplace');
    setPage(res.data.data);
  };
  useEffect(() => { load(); }, []);

  const addBlock = (type) => {
    setPage({ ...page, blocks: [...page.blocks, { type, title: '', content: '', order: page.blocks.length }] });
  };

  const updateBlock = (i, field, val) => {
    setPage({ ...page, blocks: page.blocks.map((b, idx) => (idx === i ? { ...b, [field]: val } : b)) });
  };

  const removeBlock = (i) => setPage({ ...page, blocks: page.blocks.filter((_, idx) => idx !== i) });

  const save = async () => {
    await client.patch('/workplace', { blocks: page.blocks });
    setEditing(false);
  };

  if (!page) return null;

  return (
    <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Company Portal</h2>
        {isPrivileged && (
          editing ? <Button onClick={save}>Save</Button> : <Button variant="secondary" onClick={() => setEditing(true)}>Edit page</Button>
        )}
      </div>

      {page.blocks.map((b, i) => (
        <div key={i} style={{ marginBottom: 16, padding: 16, border: '1px solid var(--color-border)', borderRadius: 10, background: 'var(--color-surface)' }}>
          {editing ? (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="Block title" value={b.title} onChange={(e) => updateBlock(i, 'title', e.target.value)} />
                <select style={{ ...inputStyle, width: 140 }} value={b.type} onChange={(e) => updateBlock(i, 'type', e.target.value)}>
                  <option value="announcement">Announcement</option>
                  <option value="link">Link</option>
                  <option value="text">Text</option>
                </select>
                <Button variant="danger" onClick={() => removeBlock(i)} style={{ fontSize: 12 }}>✕</Button>
              </div>
              <textarea style={{ ...inputStyle, minHeight: 60 }} placeholder={b.type === 'link' ? 'URL' : 'Content'} value={b.content} onChange={(e) => updateBlock(i, 'content', e.target.value)} />
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: 4 }}>{b.type}</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{b.title}</div>
              {b.type === 'link' ? (
                <a href={b.content} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>{b.content}</a>
              ) : (
                <p style={{ color: 'var(--color-text-muted)' }}>{b.content}</p>
              )}
            </div>
          )}
        </div>
      ))}

      {editing && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => addBlock('announcement')}>+ Announcement</Button>
          <Button variant="secondary" onClick={() => addBlock('link')}>+ Link</Button>
          <Button variant="secondary" onClick={() => addBlock('text')}>+ Text</Button>
        </div>
      )}
    </div>
  );
}
