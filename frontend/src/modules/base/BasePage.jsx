import { useEffect, useState } from 'react';
import client from '../../shared/api/client';
import PanelLayout from '../../shared/components/PanelLayout';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import Field, { inputStyle } from '../../shared/components/Field';
import EmptyState from '../../shared/components/EmptyState';
import ShareButton from '../../shared/components/ShareButton';

export default function BasePage() {
  const [tables, setTables] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', columns: [{ id: 'col1', name: 'Name', type: 'text' }] });

  const load = async () => {
    const res = await client.get('/base/tables');
    setTables(res.data.data);
  };
  useEffect(() => { load(); }, []);

  const open = async (t) => {
    const res = await client.get(`/base/tables/${t._id}`);
    setSelected(res.data.data);
  };

  const submit = async (e) => {
    e.preventDefault();
    await client.post('/base/tables', form);
    setShowForm(false);
    setForm({ name: '', columns: [{ id: 'col1', name: 'Name', type: 'text' }] });
    load();
  };

  const addColumnField = () => setForm((f) => ({ ...f, columns: [...f.columns, { id: `col${f.columns.length + 1}`, name: '', type: 'text' }] }));
  const updateColumnField = (i, field, val) => setForm((f) => ({ ...f, columns: f.columns.map((c, idx) => (idx === i ? { ...c, [field]: val } : c)) }));

  const addRow = async () => {
    const data = {};
    selected.columns.forEach((c) => { data[c.id] = ''; });
    const res = await client.post(`/base/tables/${selected._id}/rows`, { data });
    setSelected({ ...selected, rows: [...selected.rows, res.data.data] });
  };

  const updateCell = async (rowId, colId, value) => {
    setSelected({
      ...selected,
      rows: selected.rows.map((r) => (r._id === rowId ? { ...r, data: { ...r.data, [colId]: value } } : r)),
    });
    await client.patch(`/base/tables/${selected._id}/rows/${rowId}`, { data: { [colId]: value } });
  };

  return (
    <PanelLayout
      title="Base"
      headerActions={<Button onClick={() => setShowForm(true)} style={{ padding: '6px 12px', fontSize: 13 }}>+ New Table</Button>}
      listContent={
        <div>
          {tables.map((t) => (
            <div key={t._id} onClick={() => open(t)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', background: selected?._id === t._id ? 'var(--color-bg)' : 'transparent' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{t.columns?.length || 0} columns</div>
            </div>
          ))}
          {tables.length === 0 && <div style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>No tables yet.</div>}
        </div>
      }
      detailContent={
        selected ? (
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{selected.name}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <ShareButton itemType="baseTable" itemId={selected._id} />
                <Button onClick={addRow} style={{ fontSize: 12, padding: '6px 12px' }}>+ Add Row</Button>
              </div>
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface)' }}>
                    {selected.columns.map((c) => (
                      <th key={c.id} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--color-border)', fontWeight: 600 }}>{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.rows.map((r) => (
                    <tr key={r._id}>
                      {selected.columns.map((c) => (
                        <td key={c.id} style={{ borderBottom: '1px solid var(--color-border)', padding: 0 }}>
                          <input
                            value={r.data?.[c.id] || ''}
                            onChange={(e) => updateCell(r._id, c.id, e.target.value)}
                            style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--color-text)', padding: '8px 12px' }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 12 }}>
              Grid view shown. Kanban/calendar views and forms/automations are supported by the API — build additional view switchers as needed.
            </p>
          </div>
        ) : (
          <EmptyState icon="🗂️" title="Select a table" subtitle="Choose a table to view and edit its data" />
        )
      }
    >
      {showForm && (
        <Modal title="New Table" onClose={() => setShowForm(false)}>
          <form onSubmit={submit}>
            <Field label="Table name"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Columns">
              {form.columns.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input style={{ ...inputStyle, flex: 2 }} placeholder="Column name" value={c.name} onChange={(e) => updateColumnField(i, 'name', e.target.value)} required />
                  <select style={{ ...inputStyle, flex: 1 }} value={c.type} onChange={(e) => updateColumnField(i, 'type', e.target.value)}>
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="dropdown">Dropdown</option>
                  </select>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addColumnField} style={{ fontSize: 12, padding: '4px 10px' }}>+ Add column</Button>
            </Field>
            <Button type="submit" style={{ width: '100%', marginTop: 8 }}>Create Table</Button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
