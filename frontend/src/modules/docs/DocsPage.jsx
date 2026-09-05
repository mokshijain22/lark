import { useEffect, useState } from 'react';
import client from '../../shared/api/client';
import PanelLayout from '../../shared/components/PanelLayout';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import Field, { inputStyle } from '../../shared/components/Field';
import EmptyState from '../../shared/components/EmptyState';
import Avatar from '../../shared/components/Avatar';
import ShareButton from '../../shared/components/ShareButton';

export default function DocsPage() {
  const [docs, setDocs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', folder: '' });
  const [saveTimer, setSaveTimer] = useState(null);

  const load = async () => {
    const res = await client.get('/docs');
    setDocs(res.data.data);
  };
  useEffect(() => { load(); }, []);

  const openDoc = async (d) => {
    const res = await client.get(`/docs/${d._id}`);
    setSelected(res.data.data);
    setContent(res.data.data.content || '');
  };

  const submit = async (e) => {
    e.preventDefault();
    await client.post('/docs', form);
    setShowForm(false);
    setForm({ title: '', folder: '' });
    load();
  };

  const onContentChange = (val) => {
    setContent(val);
    if (saveTimer) clearTimeout(saveTimer);
    const t = setTimeout(async () => {
      await client.patch(`/docs/${selected._id}`, { content: val });
    }, 800); // autosave
    setSaveTimer(t);
  };

  return (
    <PanelLayout
      title="Docs & Wiki"
      headerActions={<Button onClick={() => setShowForm(true)} style={{ padding: '6px 12px', fontSize: 13 }}>+ New</Button>}
      listContent={
        <div>
          {docs.map((d) => (
            <div key={d._id} onClick={() => openDoc(d)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', background: selected?._id === d._id ? 'var(--color-bg)' : 'transparent' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{d.title}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{d.folder || 'No folder'} · {new Date(d.updatedAt).toLocaleDateString()}</div>
            </div>
          ))}
          {docs.length === 0 && <div style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>No documents yet.</div>}
        </div>
      }
      detailContent={
        selected ? (
          <div style={{ padding: 32, maxWidth: 720 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>{selected.title}</h2>
              <ShareButton itemType="document" itemId={selected._id} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <Avatar name={selected.author?.name} src={selected.author?.avatar} size={20} />
              {selected.author?.name} · autosaves as you type
            </div>
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Start writing... (bold/italic/headings/lists can be added with a rich text editor library like TipTap)"
              style={{ width: '100%', minHeight: 400, padding: 16, border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', color: 'var(--color-text)', lineHeight: 1.7, resize: 'vertical' }}
            />
          </div>
        ) : (
          <EmptyState icon="📄" title="Select a document" subtitle="Choose a document to view or edit" />
        )
      }
    >
      {showForm && (
        <Modal title="New Document" onClose={() => setShowForm(false)}>
          <form onSubmit={submit}>
            <Field label="Title"><input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
            <Field label="Folder (optional)"><input style={inputStyle} value={form.folder} onChange={(e) => setForm({ ...form, folder: e.target.value })} placeholder="e.g. Engineering/Specs" /></Field>
            <Button type="submit" style={{ width: '100%' }}>Create</Button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
