import { useEffect, useState } from 'react';
import client from '../../shared/api/client';
import PanelLayout from '../../shared/components/PanelLayout';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import Field, { inputStyle } from '../../shared/components/Field';
import EmptyState from '../../shared/components/EmptyState';
import { Calendar, StickyNote } from 'lucide-react';

export default function MinutesPage() {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState('');
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', linkedEvent: '' });
  const [saveTimer, setSaveTimer] = useState(null);

  const load = async () => {
    const res = await client.get('/minutes');
    setList(res.data.data);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const { from, to } = { from: new Date(new Date().setDate(1)), to: new Date(new Date().setMonth(new Date().getMonth() + 1)) };
    client.get('/calendar/events', { params: { from: from.toISOString(), to: to.toISOString() } }).then((r) => setEvents(r.data.data));
  }, []);

  const open = async (m) => {
    const res = await client.get(`/minutes/${m._id}`);
    setSelected(res.data.data);
    setContent(res.data.data.content || '');
  };

  const submit = async (e) => {
    e.preventDefault();
    await client.post('/minutes', form);
    setShowForm(false);
    setForm({ title: '', linkedEvent: '' });
    load();
  };

  const onContentChange = (val) => {
    setContent(val);
    if (saveTimer) clearTimeout(saveTimer);
    setSaveTimer(setTimeout(() => client.patch(`/minutes/${selected._id}`, { content: val }), 800));
  };

  return (
    <PanelLayout
      title="Minutes"
      headerActions={<Button onClick={() => setShowForm(true)} style={{ padding: '6px 12px', fontSize: 13 }}>+ New</Button>}
      listContent={
        <div>
          {list.map((m) => (
            <div key={m._id} onClick={() => open(m)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', background: selected?._id === m._id ? 'var(--color-bg)' : 'transparent' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</div>
              {m.linkedEvent && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}><Calendar size={12} /> {m.linkedEvent.title}</div>}
            </div>
          ))}
          {list.length === 0 && <div style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>No meeting notes yet.</div>}
        </div>
      }
      detailContent={
        selected ? (
          <div style={{ padding: 32, maxWidth: 720 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{selected.title}</h2>
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Take notes during the meeting..."
              style={{ width: '100%', minHeight: 400, padding: 16, border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', color: 'var(--color-text)', lineHeight: 1.7, resize: 'vertical' }}
            />
          </div>
        ) : (
          <EmptyState icon={StickyNote} title="Select meeting notes" subtitle="Choose notes from the list or create new ones" />
        )
      }
    >
      {showForm && (
        <Modal title="New Meeting Notes" onClose={() => setShowForm(false)}>
          <form onSubmit={submit}>
            <Field label="Title"><input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
            <Field label="Link to event (optional)">
              <select style={inputStyle} value={form.linkedEvent} onChange={(e) => setForm({ ...form, linkedEvent: e.target.value })}>
                <option value="">None</option>
                {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
              </select>
            </Field>
            <Button type="submit" style={{ width: '100%' }}>Create</Button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
