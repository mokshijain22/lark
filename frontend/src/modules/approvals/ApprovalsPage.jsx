import { useEffect, useState } from 'react';
import client from '../../shared/api/client';
import { useAuth } from '../../shared/context/AuthContext';
import PanelLayout from '../../shared/components/PanelLayout';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import Field, { inputStyle } from '../../shared/components/Field';
import EmptyState from '../../shared/components/EmptyState';
import Avatar from '../../shared/components/Avatar';
import { CheckSquare } from 'lucide-react';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('mine'); // 'mine' | 'pending'
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: '', title: '', description: '', leaveStartDate: '', leaveEndDate: '' });
  const [attachment, setAttachment] = useState(null);

  const load = async () => {
    const endpoint = tab === 'mine' ? '/approvals/mine' : '/approvals/pending';
    const res = await client.get(endpoint);
    setList(res.data.data);
    setSelected(null);
  };

  useEffect(() => {
    load();
  }, [tab]);

  const submit = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([k, v]) => payload.append(k, v));
    if (attachment) payload.append('attachment', attachment);
    await client.post('/approvals', payload);
    setShowForm(false);
    setForm({ type: '', title: '', description: '', leaveStartDate: '', leaveEndDate: '' });
    setAttachment(null);
    load();
  };

  const act = async (id, decision) => {
    await client.patch(`/approvals/${id}/action`, { decision });
    load();
  };

  return (
    <PanelLayout
      title="Approvals"
      headerActions={
        <Button onClick={() => setShowForm(true)} style={{ padding: '6px 12px', fontSize: 13 }}>
          + New
        </Button>
      }
      listContent={
        <div>
          <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
            <button
              onClick={() => setTab('mine')}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 6,
                border: 'none',
                background: tab === 'mine' ? 'var(--color-primary)' : 'var(--color-bg)',
                color: tab === 'mine' ? '#fff' : 'var(--color-text)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              My Requests
            </button>
            <button
              onClick={() => setTab('pending')}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 6,
                border: 'none',
                background: tab === 'pending' ? 'var(--color-primary)' : 'var(--color-bg)',
                color: tab === 'pending' ? '#fff' : 'var(--color-text)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              To Approve
            </button>
          </div>
          {list.map((r) => (
            <div
              key={r._id}
              onClick={() => setSelected(r)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: selected?._id === r._id ? 'var(--color-bg)' : 'transparent',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</span>
                <Badge>{r.status}</Badge>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{r.type}</div>
            </div>
          ))}
          {list.length === 0 && (
            <div style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Nothing here yet.</div>
          )}
        </div>
      }
      detailContent={
        selected ? (
          <div style={{ padding: 32, maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>{selected.title}</h2>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 4 }}>{selected.type}</div>
              </div>
              <Badge>{selected.status}</Badge>
            </div>

            {selected.requester?.name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                <Avatar name={selected.requester.name} src={selected.requester.avatar} size={28} />
                <span style={{ fontSize: 13 }}>Requested by {selected.requester.name}</span>
              </div>
            )}

            {selected.description && (
              <p style={{ marginTop: 16, lineHeight: 1.6, color: 'var(--color-text-muted)' }}>{selected.description}</p>
            )}

            {selected.leaveStartDate && selected.leaveEndDate && (
              <div style={{ marginTop: 16, fontSize: 13, color: 'var(--color-text)' }}>
                <strong>Leave dates:</strong> {new Date(selected.leaveStartDate).toLocaleDateString()} – {new Date(selected.leaveEndDate).toLocaleDateString()}
              </div>
            )}

            {selected.attachment && (
              <a href={selected.attachment} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 12, color: 'var(--color-primary)', fontSize: 13, fontWeight: 600 }}>
                View attachment ↗
              </a>
            )}

            {tab === 'pending' && selected.status === 'Pending' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <Button variant="success" onClick={() => act(selected._id, 'Approved')}>
                  Approve
                </Button>
                <Button variant="danger" onClick={() => act(selected._id, 'Rejected')}>
                  Reject
                </Button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState icon={CheckSquare} title="Select a request" subtitle="Choose a request from the list to view details" />
        )
      }
    >
      {showForm && (
        <Modal title="New Request" onClose={() => setShowForm(false)}>
          <form onSubmit={submit}>
            <Field label="Type">
              <input
                style={inputStyle}
                placeholder="e.g. Leave Request, Expense Claim"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                required
              />
            </Field>
            <Field label="Title">
              <input
                style={inputStyle}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </Field>
            <Field label="Description">
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <Field label="Leave dates (optional — only used for leave-type requests, syncs to Attendance once approved)">
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="date"
                  style={inputStyle}
                  value={form.leaveStartDate}
                  onChange={(e) => setForm({ ...form, leaveStartDate: e.target.value })}
                />
                <input
                  type="date"
                  style={inputStyle}
                  value={form.leaveEndDate}
                  onChange={(e) => setForm({ ...form, leaveEndDate: e.target.value })}
                />
              </div>
            </Field>
            <Field label="Attachment (optional)">
              <input
                type="file"
                onChange={(e) => setAttachment(e.target.files[0] || null)}
                style={{ fontSize: 13 }}
              />
            </Field>
            <Button type="submit" style={{ width: '100%' }}>Submit Request</Button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
