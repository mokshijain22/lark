import { useEffect, useState } from 'react';
import client from '../../shared/api/client';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import Field, { inputStyle } from '../../shared/components/Field';
import EmptyState from '../../shared/components/EmptyState';

export default function AnycrossPage() {
  const [rules, setRules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', triggerModule: 'schedule', time: '09:00', message: '' });

  const load = async () => {
    const res = await client.get('/anycross');
    setRules(res.data.data);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await client.post('/anycross', {
      name: form.name,
      trigger: { module: form.triggerModule, time: form.time, frequency: 'daily' },
      action: { type: 'send_channel_message', message: form.message },
    });
    setShowForm(false);
    setForm({ name: '', triggerModule: 'schedule', time: '09:00', message: '' });
    load();
  };

  const toggle = async (id) => { await client.patch(`/anycross/${id}/toggle`); load(); };
  const remove = async (id) => { await client.delete(`/anycross/${id}`); load(); };

  return (
    <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Anycross — Automations</h2>
        <Button onClick={() => setShowForm(true)}>+ New Rule</Button>
      </div>

      {rules.length === 0 && <EmptyState icon="⚡" title="No automations yet" subtitle='Create rules like "Every day at 9am, send a reminder"' />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rules.map((r) => (
          <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: '1px solid var(--color-border)', borderRadius: 10, background: 'var(--color-surface)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Trigger: {r.trigger.module}{r.trigger.time ? ` at ${r.trigger.time} (${r.trigger.frequency})` : ''} → {r.action.type}
              </div>
            </div>
            <Button variant={r.isActive ? 'success' : 'secondary'} onClick={() => toggle(r._id)} style={{ fontSize: 12, padding: '6px 12px' }}>
              {r.isActive ? 'Active' : 'Paused'}
            </Button>
            <Button variant="danger" onClick={() => remove(r._id)} style={{ fontSize: 12, padding: '6px 12px' }}>Delete</Button>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title="New Automation" onClose={() => setShowForm(false)}>
          <form onSubmit={submit}>
            <Field label="Rule name"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Trigger">
              <select style={inputStyle} value={form.triggerModule} onChange={(e) => setForm({ ...form, triggerModule: e.target.value })}>
                <option value="schedule">Time-based (daily)</option>
                <option value="approvals">New Approval request</option>
                <option value="base">Base row added</option>
              </select>
            </Field>
            {form.triggerModule === 'schedule' && (
              <Field label="Time"><input type="time" style={inputStyle} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
            )}
            <Field label="Message to send"><textarea style={{ ...inputStyle, minHeight: 60 }} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></Field>
            <Button type="submit" style={{ width: '100%' }}>Create Rule</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
