import { useEffect, useRef, useState } from 'react';
import client from '../../shared/api/client';
import PanelLayout from '../../shared/components/PanelLayout';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import Field, { inputStyle } from '../../shared/components/Field';
import EmptyState from '../../shared/components/EmptyState';
import ShareButton from '../../shared/components/ShareButton';

const CANVAS_W = 720;
const CANVAS_H = 405; // 16:9

// A single element on the canvas - draggable by its body, resizable by its bottom-right handle.
function CanvasElement({ el, selected, onSelect, onChange, onDelete }) {
  const dragState = useRef(null);

  const startDrag = (e) => {
    e.stopPropagation();
    onSelect();
    dragState.current = { mode: 'move', startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
  };

  const startResize = (e) => {
    e.stopPropagation();
    dragState.current = { mode: 'resize', startX: e.clientX, startY: e.clientY, origW: el.w, origH: el.h };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
  };

  const onMouseMove = (e) => {
    const d = dragState.current;
    if (!d) return;
    if (d.mode === 'move') {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      onChange({ ...el, x: Math.max(0, d.origX + dx), y: Math.max(0, d.origY + dy) });
    } else {
      const dw = e.clientX - d.startX;
      const dh = e.clientY - d.startY;
      onChange({ ...el, w: Math.max(40, d.origW + dw), h: Math.max(24, d.origH + dh) });
    }
  };

  const stopDrag = () => {
    dragState.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', stopDrag);
  };

  return (
    <div
      onMouseDown={startDrag}
      style={{
        position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h,
        border: selected ? '2px solid var(--color-primary)' : '1px dashed transparent',
        cursor: 'move', userSelect: 'none',
        background: el.type === 'shape' ? (el.shapeColor || '#155EEF') : 'transparent',
        borderRadius: el.type === 'shape' && el.shapeType === 'circle' ? '50%' : el.type === 'shape' ? 4 : 0,
        display: 'flex', alignItems: el.type === 'text' ? 'flex-start' : 'center', justifyContent: 'center',
      }}
    >
      {el.type === 'text' && (
        <textarea
          value={el.content || ''}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => onChange({ ...el, content: e.target.value })}
          placeholder="Text..."
          style={{
            width: '100%', height: '100%', border: 'none', background: 'transparent', resize: 'none',
            fontSize: el.fontSize || 18, color: el.color || '#111', fontWeight: el.bold ? 700 : 400, padding: 4,
          }}
        />
      )}
      {selected && (
        <>
          <div
            onMouseDown={startResize}
            style={{ position: 'absolute', right: -5, bottom: -5, width: 12, height: 12, background: 'var(--color-primary)', borderRadius: 3, cursor: 'nwse-resize' }}
          />
          <button
            onMouseDown={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ position: 'absolute', top: -12, right: -12, width: 20, height: 20, borderRadius: '50%', background: 'var(--color-danger)', color: '#fff', border: 'none', fontSize: 11, lineHeight: 1 }}
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
}

export default function SlidesPage() {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedElId, setSelectedElId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [presenting, setPresenting] = useState(false);
  const saveTimer = useRef(null);

  const load = async () => {
    const res = await client.get('/slides');
    setList(res.data.data);
  };
  useEffect(() => { load(); }, []);

  const open = async (p) => {
    const res = await client.get(`/slides/${p._id}`);
    setSelected(res.data.data);
    setActiveSlide(0);
    setSelectedElId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    await client.post('/slides', { title });
    setShowForm(false);
    setTitle('');
    load();
  };

  const addSlide = async () => {
    const res = await client.post(`/slides/${selected._id}/slides`);
    setSelected({ ...selected, slides: [...selected.slides, res.data.data] });
    setActiveSlide(selected.slides.length);
  };

  const deleteSlide = async (slideId, idx) => {
    if (selected.slides.length <= 1) return;
    await client.delete(`/slides/${selected._id}/slides/${slideId}`);
    const newSlides = selected.slides.filter((s) => s._id !== slideId);
    setSelected({ ...selected, slides: newSlides });
    setActiveSlide(Math.max(0, idx - 1));
  };

  const persistSlide = (elements) => {
    const slide = selected.slides[activeSlide];
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      client.patch(`/slides/${selected._id}/slides/${slide._id}`, { elements });
    }, 400);
  };

  const updateElements = (elements) => {
    setSelected({ ...selected, slides: selected.slides.map((s, i) => (i === activeSlide ? { ...s, elements } : s)) });
    persistSlide(elements);
  };

  const addElement = (type) => {
    const slide = selected.slides[activeSlide];
    const base = { id: `el_${Date.now()}`, x: 60, y: 60, w: 240, h: type === 'text' ? 60 : 120 };
    const el = type === 'text'
      ? { ...base, type: 'text', content: 'New text', fontSize: 18 }
      : { ...base, type: 'shape', shapeType: 'rectangle', shapeColor: '#155EEF' };
    const elements = [...(slide.elements || []), el];
    updateElements(elements);
    setSelectedElId(el.id);
  };

  const updateElement = (updated) => {
    const slide = selected.slides[activeSlide];
    const elements = slide.elements.map((e) => (e.id === updated.id ? updated : e));
    updateElements(elements);
  };

  const deleteElement = (id) => {
    const slide = selected.slides[activeSlide];
    updateElements(slide.elements.filter((e) => e.id !== id));
    setSelectedElId(null);
  };

  if (presenting && selected) {
    const slide = selected.slides[activeSlide];
    return (
      <div style={{ flex: 1, background: slide.background || '#fff', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, background: slide.background || '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
          {(slide.elements || []).map((el) => (
            <div key={el.id} style={{
              position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h,
              background: el.type === 'shape' ? el.shapeColor : 'transparent',
              borderRadius: el.type === 'shape' && el.shapeType === 'circle' ? '50%' : 0,
              fontSize: el.fontSize, color: el.color || '#111', fontWeight: el.bold ? 700 : 400, whiteSpace: 'pre-wrap',
            }}>
              {el.type === 'text' && el.content}
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 24, display: 'flex', gap: 12 }}>
          <Button variant="secondary" onClick={() => setActiveSlide((i) => Math.max(0, i - 1))}>‹ Prev</Button>
          <Button variant="secondary" onClick={() => setActiveSlide((i) => Math.min(selected.slides.length - 1, i + 1))}>Next ›</Button>
          <Button variant="danger" onClick={() => setPresenting(false)}>Exit</Button>
        </div>
      </div>
    );
  }

  const currentSlide = selected?.slides[activeSlide];

  return (
    <PanelLayout
      title="Slides"
      headerActions={<Button onClick={() => setShowForm(true)} style={{ padding: '6px 12px', fontSize: 13 }}>+ New</Button>}
      listContent={
        <div>
          {list.map((p) => (
            <div key={p._id} onClick={() => open(p)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', background: selected?._id === p._id ? 'var(--color-bg)' : 'transparent' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
            </div>
          ))}
          {list.length === 0 && <div style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>No presentations yet.</div>}
        </div>
      }
      detailContent={
        selected ? (
          <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ width: 150, borderRight: '1px solid var(--color-border)', overflowY: 'auto', padding: 12 }}>
              {selected.slides.map((s, i) => (
                <div
                  key={s._id}
                  onClick={() => { setActiveSlide(i); setSelectedElId(null); }}
                  style={{ position: 'relative', aspectRatio: '16/9', border: `2px solid ${activeSlide === i ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 6, marginBottom: 10, background: s.background || '#fff', cursor: 'pointer', overflow: 'hidden' }}
                >
                  {(s.elements || []).map((el) => (
                    <div key={el.id} style={{
                      position: 'absolute', left: `${(el.x / CANVAS_W) * 100}%`, top: `${(el.y / CANVAS_H) * 100}%`,
                      width: `${(el.w / CANVAS_W) * 100}%`, height: `${(el.h / CANVAS_H) * 100}%`,
                      background: el.type === 'shape' ? el.shapeColor : 'transparent', fontSize: 6, color: '#333', overflow: 'hidden',
                    }}>
                      {el.type === 'text' && el.content}
                    </div>
                  ))}
                  {selected.slides.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); deleteSlide(s._id, i); }} style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, fontSize: 9, borderRadius: '50%', border: 'none', background: 'var(--color-danger)', color: '#fff' }}>✕</button>
                  )}
                </div>
              ))}
              <Button variant="secondary" onClick={addSlide} style={{ width: '100%', fontSize: 12, padding: '6px 0' }}>+ Slide</Button>
            </div>

            <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{selected.title}</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="secondary" onClick={() => addElement('text')} style={{ fontSize: 12, padding: '6px 12px' }}>+ Text</Button>
                  <Button variant="secondary" onClick={() => addElement('shape')} style={{ fontSize: 12, padding: '6px 12px' }}>+ Shape</Button>
                  <Button onClick={() => setPresenting(true)} style={{ fontSize: 12, padding: '6px 12px' }}>▶ Present</Button>
                  <ShareButton itemType="presentation" itemId={selected._id} />
                </div>
              </div>

              <div
                onMouseDown={() => setSelectedElId(null)}
                style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, background: currentSlide.background || '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}
              >
                {(currentSlide.elements || []).map((el) => (
                  <CanvasElement
                    key={el.id}
                    el={el}
                    selected={selectedElId === el.id}
                    onSelect={() => setSelectedElId(el.id)}
                    onChange={updateElement}
                    onDelete={() => deleteElement(el.id)}
                  />
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 12 }}>
                Drag elements to move, use the bottom-right handle to resize. Click ✕ on a selected element to delete it.
              </p>
            </div>
          </div>
        ) : (
          <EmptyState icon="🖥️" title="Select a presentation" subtitle="Choose a presentation to edit" />
        )
      }
    >
      {showForm && (
        <Modal title="New Presentation" onClose={() => setShowForm(false)}>
          <form onSubmit={submit}>
            <Field label="Title"><input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
            <Button type="submit" style={{ width: '100%' }}>Create</Button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
