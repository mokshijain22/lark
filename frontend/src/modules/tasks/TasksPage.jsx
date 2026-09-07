import { useEffect, useState } from 'react';
import client from '../../shared/api/client';
import PanelLayout from '../../shared/components/PanelLayout';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import Field, { inputStyle } from '../../shared/components/Field';
import EmptyState from '../../shared/components/EmptyState';
import Avatar from '../../shared/components/Avatar';
import ShareButton from '../../shared/components/ShareButton';
import { ListTodo } from 'lucide-react';

const statuses = ['To-do', 'In Progress', 'Done'];

export default function TasksPage() {
  const [tab, setTab] = useState('assigned'); // 'assigned' | 'created'
  const [list, setList] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', assignee: '', priority: 'Medium', project: '' });

  const load = async () => {
    const endpoint = tab === 'assigned' ? '/tasks/assigned-to-me' : '/tasks/created-by-me';
    const res = await client.get(endpoint);
    setList(res.data.data);
    setSelected(null);
  };

  useEffect(() => { load(); }, [tab]);
  useEffect(() => {
    client.get('/contacts').then((res) => setContacts(res.data.data));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await client.post('/tasks', form);
    setShowForm(false);
    setForm({ title: '', description: '', dueDate: '', assignee: '', priority: 'Medium', project: '' });
    load();
  };

  const updateStatus = async (id, status) => {
    await client.patch(`/tasks/${id}`, { status });
    load();
  };

  return (
    <PanelLayout
      title="Tasks"
      headerActions={
        <Button onClick={() => setShowForm(true)} style={{ padding: '6px 12px', fontSize: 13 }}>
          + New
        </Button>
      }
      listContent={
        <div>
          <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
            <button
              onClick={() => setTab('assigned')}
              style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: tab === 'assigned' ? 'var(--color-primary)' : 'var(--color-bg)', color: tab === 'assigned' ? '#fff' : 'var(--color-text)', fontSize: 13, fontWeight: 600 }}
            >
              Assigned to me
            </button>
            <button
              onClick={() => setTab('created')}
              style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: tab === 'created' ? 'var(--color-primary)' : 'var(--color-bg)', color: tab === 'created' ? '#fff' : 'var(--color-text)', fontSize: 13, fontWeight: 600 }}
            >
              Created by me
            </button>
          </div>
          {list.map((t) => (
            <div
              key={t._id}
              onClick={() => setSelected(t)}
              style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', background: selected?._id === t._id ? 'var(--color-bg)' : 'transparent' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</span>
                <Badge>{t.priority}</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge>{t.status}</Badge>
                {t.dueDate && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{new Date(t.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>No tasks here.</div>
          )}
        </div>
      }
      detailContent={
        selected ? (
          <div style={{ padding: 32, maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{selected.title}</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge>{selected.priority}</Badge>
                <ShareButton itemType="task" itemId={selected._id} />
              </div>
            </div>

            {selected.description && (
              <p style={{ marginTop: 12, lineHeight: 1.6, color: 'var(--color-text-muted)' }}>{selected.description}</p>
            )}

            <div style={{ display: 'flex', gap: 20, marginTop: 20, fontSize: 13 }}>
              {selected.dueDate && (
                <div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Due date</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{new Date(selected.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              )}
              {selected.project && (
                <div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Project</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{selected.project}</div>
                </div>
              )}
            </div>

            {(selected.assignee || selected.createdBy) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
                <Avatar name={(selected.assignee || selected.createdBy).name} src={(selected.assignee || selected.createdBy).avatar} size={28} />
                <span style={{ fontSize: 13 }}>
                  {tab === 'assigned' ? `Created by ${selected.createdBy.name}` : `Assigned to ${selected.assignee?.name || 'Unassigned'}`}
                </span>
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-muted)' }}>Status</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {statuses.map((s) => (
                  <Button
                    key={s}
                    variant={selected.status === s ? 'primary' : 'secondary'}
                    onClick={() => { updateStatus(selected._id, s); setSelected({ ...selected, status: s }); }}
                    style={{ fontSize: 12, padding: '6px 12px' }}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState icon={ListTodo} title="Select a task" subtitle="Choose a task from the list to view details" />
        )
      }
    >
      {showForm && (
        <Modal title="New Task" onClose={() => setShowForm(false)}>
          <form onSubmit={submit}>
            <Field label="Title">
              <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>
            <Field label="Description">
              <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div style={{ display: 'flex', gap: 10 }}>
              <Field label="Due date">
                <input type="date" style={inputStyle} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </Field>
              <Field label="Priority">
                <select style={inputStyle} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </Field>
            </div>
            <Field label="Assignee">
              <select style={inputStyle} value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
                <option value="">Unassigned</option>
                {contacts.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Project (optional)">
              <input style={inputStyle} value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} placeholder="e.g. Website Redesign" />
            </Field>
            <Button type="submit" style={{ width: '100%' }}>Create Task</Button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
