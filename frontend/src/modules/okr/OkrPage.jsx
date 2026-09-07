import { useEffect, useState } from 'react';
import client from '../../shared/api/client';
import PanelLayout from '../../shared/components/PanelLayout';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import Field, { inputStyle } from '../../shared/components/Field';
import EmptyState from '../../shared/components/EmptyState';
import Avatar from '../../shared/components/Avatar';
import { Target } from 'lucide-react';

export default function OkrPage() {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', quarter: '', keyResults: [{ title: '', targetValue: 100, unit: '%' }] });

  const load = async () => {
    const res = await client.get('/okr');
    setList(res.data.data);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await client.post('/okr', form);
    setShowForm(false);
    setForm({ title: '', description: '', quarter: '', keyResults: [{ title: '', targetValue: 100, unit: '%' }] });
    load();
  };

  const updateProgress = async (okrId, krId, currentValue) => {
    await client.patch(`/okr/${okrId}/key-results/${krId}`, { currentValue });
    const res = await client.get('/okr');
    setList(res.data.data);
    setSelected(res.data.data.find((o) => o._id === okrId));
  };

  const addKrField = () => setForm((f) => ({ ...f, keyResults: [...f.keyResults, { title: '', targetValue: 100, unit: '%' }] }));
  const updateKrField = (i, field, val) => setForm((f) => ({ ...f, keyResults: f.keyResults.map((kr, idx) => (idx === i ? { ...kr, [field]: val } : kr)) }));

  return (
    <PanelLayout
      title="OKRs"
      headerActions={<Button onClick={() => setShowForm(true)} style={{ padding: '6px 12px', fontSize: 13 }}>+ New</Button>}
      listContent={
        <div>
          {list.map((o) => (
            <div key={o._id} onClick={() => setSelected(o)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', background: selected?._id === o._id ? 'var(--color-bg)' : 'transparent' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{o.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--color-border)' }}>
                  <div style={{ width: `${o.progress}%`, height: '100%', borderRadius: 3, background: 'var(--color-primary)' }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{o.progress}%</span>
              </div>
            </div>
          ))}
          {list.length === 0 && <div style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>No OKRs yet.</div>}
        </div>
      }
      detailContent={
        selected ? (
          <div style={{ padding: 32, maxWidth: 560 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{selected.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 16px' }}>
              <Avatar name={selected.owner?.name} src={selected.owner?.avatar} size={22} />
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{selected.owner?.name} · {selected.quarter || 'No quarter set'}</span>
            </div>
            {selected.description && <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>{selected.description}</p>}

            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Key Results</div>
            {selected.keyResults.map((kr) => (
              <div key={kr._id} style={{ marginBottom: 16, padding: 12, border: '1px solid var(--color-border)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span>{kr.title}</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{kr.currentValue}/{kr.targetValue} {kr.unit}</span>
                </div>
                <input
                  type="range" min="0" max={kr.targetValue} value={kr.currentValue}
                  onChange={(e) => updateProgress(selected._id, kr._id, Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Target} title="Select an OKR" subtitle="Choose an objective to view or update progress" />
        )
      }
    >
      {showForm && (
        <Modal title="New OKR" onClose={() => setShowForm(false)}>
          <form onSubmit={submit}>
            <Field label="Objective"><input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
            <Field label="Description"><textarea style={{ ...inputStyle, minHeight: 60 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Quarter"><input style={inputStyle} value={form.quarter} onChange={(e) => setForm({ ...form, quarter: e.target.value })} placeholder="e.g. Q1-2026" /></Field>
            <Field label="Key Results">
              {form.keyResults.map((kr, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input style={{ ...inputStyle, flex: 2 }} placeholder="Key result" value={kr.title} onChange={(e) => updateKrField(i, 'title', e.target.value)} required />
                  <input style={{ ...inputStyle, flex: 1 }} type="number" placeholder="Target" value={kr.targetValue} onChange={(e) => updateKrField(i, 'targetValue', Number(e.target.value))} />
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addKrField} style={{ fontSize: 12, padding: '4px 10px' }}>+ Add key result</Button>
            </Field>
            <Button type="submit" style={{ width: '100%', marginTop: 8 }}>Create OKR</Button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
