import { useEffect, useState } from 'react';
import client from '../../shared/api/client';
import PanelLayout from '../../shared/components/PanelLayout';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import Field, { inputStyle } from '../../shared/components/Field';
import EmptyState from '../../shared/components/EmptyState';
import { Mail } from 'lucide-react';

export default function GmailPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.get('/integrations/google/messages');
      setList(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Gmail messages');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setSendError(null);
    try {
      await client.post('/integrations/google/send', form);
      setShowForm(false);
      setForm({ to: '', subject: '', body: '' });
      load();
    } catch (err) {
      setSendError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <PanelLayout
      title="Gmail"
      headerActions={<Button onClick={() => setShowForm(true)} style={{ padding: '6px 12px', fontSize: 13 }}>+ Compose</Button>}
      listContent={
        <div>
          {loading && <div style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Loading...</div>}
          {error && <div style={{ padding: 20, color: 'var(--color-danger, #d33)', fontSize: 13 }}>{error}</div>}
          {!loading && !error && list.map((m) => (
            <div key={m.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ fontWeight: m.isUnread ? 700 : 500, fontSize: 14 }}>{m.subject}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{m.from}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{m.snippet}</div>
            </div>
          ))}
          {!loading && !error && list.length === 0 && (
            <div style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Nothing in the inbox.</div>
          )}
        </div>
      }
      detailContent={<EmptyState icon={Mail} title="Gmail" subtitle="Select a message from the list, or compose a new one" />}
    >
      {showForm && (
        <Modal title="Compose Gmail" onClose={() => setShowForm(false)} width={480}>
          <form onSubmit={submit}>
            <Field label="To"><input style={inputStyle} type="email" required value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></Field>
            <Field label="Subject"><input style={inputStyle} required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
            <Field label="Message"><textarea style={{ ...inputStyle, minHeight: 120 }} required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
            {sendError && <div style={{ color: 'var(--color-danger, #d33)', fontSize: 12, marginBottom: 12 }}>{sendError}</div>}
            <Button type="submit" disabled={sending} style={{ width: '100%' }}>{sending ? 'Sending...' : 'Send'}</Button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}