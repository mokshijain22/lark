import { useEffect, useState } from 'react';
import client from '../../shared/api/client';
import PanelLayout from '../../shared/components/PanelLayout';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import Field, { inputStyle } from '../../shared/components/Field';
import EmptyState from '../../shared/components/EmptyState';
import ShareButton from '../../shared/components/ShareButton';
import { Table2 } from 'lucide-react';

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROWS = Array.from({ length: 15 }, (_, i) => i + 1);

export default function SheetsPage() {
  const [sheets, setSheets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [editingRef, setEditingRef] = useState(null); // shows raw formula while focused, computed value otherwise

  const load = async () => {
    const res = await client.get('/sheets');
    setSheets(res.data.data);
  };
  useEffect(() => { load(); }, []);

  const open = async (s) => {
    const res = await client.get(`/sheets/${s._id}`);
    setSelected(res.data.data);
    setActiveTab(0);
  };

  const submit = async (e) => {
    e.preventDefault();
    await client.post('/sheets', { title });
    setShowForm(false);
    setTitle('');
    load();
  };

  const updateCell = async (ref, value) => {
    // Optimistic local update first so typing feels instant...
    const tab = selected.tabs[activeTab];
    const newCells = { ...tab.cells, [ref]: { value, computedValue: value } };
    setSelected({ ...selected, tabs: selected.tabs.map((t, i) => (i === activeTab ? { ...t, cells: newCells } : t)) });

    // ...then replace with the server's recalculated tab (picks up formula results,
    // including any other cells whose formulas reference this one).
    const res = await client.patch(`/sheets/${selected._id}/cells`, { tabIndex: activeTab, cells: { [ref]: { value } } });
    setSelected((prev) => ({ ...prev, tabs: prev.tabs.map((t, i) => (i === activeTab ? res.data.data : t)) }));
  };

  return (
    <PanelLayout
      title="Sheets"
      headerActions={<Button onClick={() => setShowForm(true)} style={{ padding: '6px 12px', fontSize: 13 }}>+ New</Button>}
      listContent={
        <div>
          {sheets.map((s) => (
            <div key={s._id} onClick={() => open(s)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', background: selected?._id === s._id ? 'var(--color-bg)' : 'transparent' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{s.title}</div>
            </div>
          ))}
          {sheets.length === 0 && <div style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>No spreadsheets yet.</div>}
        </div>
      }
      detailContent={
        selected ? (
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{selected.title}</h2>
              <ShareButton itemType="spreadsheet" itemId={selected._id} />
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ width: 32, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}></th>
                    {COLS.map((c) => (
                      <th key={c} style={{ width: 90, padding: 6, background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontWeight: 600 }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr key={r}>
                      <td style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-muted)' }}>{r}</td>
                      {COLS.map((c) => {
                        const ref = `${c}${r}`;
                        const cell = selected.tabs[activeTab]?.cells?.[ref];
                        const displayValue = editingRef === ref ? (cell?.value ?? '') : (cell?.computedValue ?? cell?.value ?? '');
                        return (
                          <td key={ref} style={{ border: '1px solid var(--color-border)', padding: 0 }}>
                            <input
                              value={displayValue}
                              onFocus={() => setEditingRef(ref)}
                              onBlur={() => setEditingRef(null)}
                              onChange={(e) => updateCell(ref, e.target.value)}
                              placeholder=""
                              style={{ width: '100%', border: 'none', background: 'transparent', color: typeof cell?.computedValue === 'string' && cell.computedValue.startsWith('#') ? 'var(--color-danger)' : 'var(--color-text)', padding: '6px 8px', fontSize: 13 }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 12 }}>
              Type a formula starting with = (e.g. =SUM(A1:A3), =AVERAGE(B1:B5), =IF(A1&gt;10,"High","Low"), =VLOOKUP(...)). Results are calculated on the server.
            </p>
          </div>
        ) : (
          <EmptyState icon={Table2} title="Select a spreadsheet" subtitle="Choose a spreadsheet to edit" />
        )
      }
    >
      {showForm && (
        <Modal title="New Spreadsheet" onClose={() => setShowForm(false)}>
          <form onSubmit={submit}>
            <Field label="Title"><input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
            <Button type="submit" style={{ width: '100%' }}>Create</Button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
