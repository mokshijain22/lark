import { useEffect, useState } from 'react';
import client from '../../shared/api/client';
import PanelLayout from '../../shared/components/PanelLayout';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import Field, { inputStyle } from '../../shared/components/Field';
import EmptyState from '../../shared/components/EmptyState';
import Avatar from '../../shared/components/Avatar';

export default function MailPage() {
  const [tab, setTab] = useState('inbox');
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ to: [], subject: '', body: '' });
  const [attachments, setAttachments] = useState([]);

  const load = async () => {
    const res = await client.get(`/mail/${tab}`);
    setList(res.data.data);
    setSelected(null);
  };
  useEffect(() => { load(); }, [tab]);
  useEffect(() => { client.get('/contacts').then((r) => setContacts(r.data.data)); }, []);

  const openMail = async (m) => {
    const res = await client.get(`/mail/${m._id}`);
    setSelected(res.data.data);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    form.to.forEach((id) => payload.append('to', id));
    payload.append('subject', form.subject);
    payload.append('body', form.body);
    attachments.forEach((file) => payload.append('attachments', file));
    await client.post('/mail', payload);
    setShowForm(false);
    setForm({ to: [], subject: '', body: '' });
    setAttachments([]);
    load();
  };

  const toggleTo = (id) => setForm((f) => ({ ...f, to: f.to.includes(id) ? f.to.filter((t) => t !== id) : [...f.to, id] }));

  return (
    <PanelLayout
      title="Mail"
      headerActions={<Button onClick={() => setShowForm(true)} style={{ padding: '6px 12px', fontSize: 13 }}>+ Compose</Button>}
      listContent={
        <div>
          <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px' }}>
            {['inbox', 'sent', 'drafts'].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', textTransform: 'capitalize', background: tab === t ? 'var(--color-primary)' : 'var(--color-bg)', color: tab === t ? '#fff' : 'var(--color-text)', fontSize: 12, fontWeight: 600 }}>{t}</button>
            ))}
          </div>
          {list.map((m) => (
            <div key={m._id} onClick={() => openMail(m)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', background: selected?._id === m._id ? 'var(--color-bg)' : 'transparent' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{m.subject || '(no subject)'}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{m.from?.name || (m.to || []).map((t) => t.name).join(', ')}</div>
            </div>
          ))}
          {list.length === 0 && <div style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Nothing here.</div>}
        </div>
      }
      detailContent={
        selected ? (
          <div style={{ padding: 32, maxWidth: 640 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{selected.subject || '(no subject)'}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Avatar name={selected.from?.name} src={selected.from?.avatar} size={28} />
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{selected.from?.name}</div>
                <div style={{ color: 'var(--color-text-muted)' }}>to {(selected.to || []).map((t) => t.name).join(', ')}</div>
              </div>
            </div>
            <p style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.body}</p>
            {selected.attachments?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                {selected.attachments.map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noreferrer" style={{ display: 'block', color: 'var(--color-primary)', fontSize: 13, marginBottom: 4 }}>📎 {a.filename}</a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <EmptyState icon="✉️" title="Select an email" subtitle="Choose a message to read" />
        )
      }
    >
      {showForm && (
        <Modal title="Compose Email" onClose={() => setShowForm(false)} width={480}>
          <form onSubmit={submit}>
            <Field label="To">
              <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, padding: 8 }}>
                {contacts.map((c) => (
                  <label key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13 }}>
                    <input type="checkbox" checked={form.to.includes(c._id)} onChange={() => toggleTo(c._id)} />
                    {c.name}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Subject"><input style={inputStyle} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
            <Field label="Message"><textarea style={{ ...inputStyle, minHeight: 120 }} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
            <Field label="Attachments (optional)">
              <input
                type="file"
                multiple
                onChange={(e) => setAttachments(Array.from(e.target.files))}
                style={{ fontSize: 13 }}
              />
            </Field>
            <Button type="submit" style={{ width: '100%' }}>Send</Button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
