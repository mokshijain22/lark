import { useEffect, useState } from 'react';
import client from '../../shared/api/client';
import { useAuth } from '../../shared/context/AuthContext';
import PanelLayout from '../../shared/components/PanelLayout';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import Field, { inputStyle } from '../../shared/components/Field';
import EmptyState from '../../shared/components/EmptyState';
import Avatar from '../../shared/components/Avatar';
import Badge from '../../shared/components/Badge';
import ShareButton from '../../shared/components/ShareButton';

const monthRange = (offset = 0) => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { from, to };
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

export default function CalendarPage() {
  const { user } = useAuth();
  const [monthOffset, setMonthOffset] = useState(0);
  const [events, setEvents] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', date: '', startTime: '', endTime: '',
    attendees: [], recurrenceType: 'none', recurrenceEndDate: '', meetingRoom: '',
  });

  const load = async () => {
    const { from, to } = monthRange(monthOffset);
    const res = await client.get('/calendar/events', {
      params: { from: from.toISOString(), to: to.toISOString() },
    });
    setEvents(res.data.data);
    setSelected(null);
  };

  useEffect(() => { load(); }, [monthOffset]);
  useEffect(() => {
    client.get('/contacts').then((res) => setContacts(res.data.data));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await client.post('/calendar/events', {
      title: form.title,
      description: form.description,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      attendees: form.attendees,
      recurrence: { type: form.recurrenceType, endDate: form.recurrenceEndDate || null },
      meetingRoom: form.meetingRoom || null,
    });
    setShowForm(false);
    setForm({ title: '', description: '', date: '', startTime: '', endTime: '', attendees: [], recurrenceType: 'none', recurrenceEndDate: '', meetingRoom: '' });
    load();
  };

  const rsvp = async (id, response) => {
    await client.patch(`/calendar/events/${id}/rsvp`, { rsvp: response });
    load();
  };

  const toggleAttendee = (id) => {
    setForm((f) => ({
      ...f,
      attendees: f.attendees.includes(id) ? f.attendees.filter((a) => a !== id) : [...f.attendees, id],
    }));
  };

  const { from } = monthRange(monthOffset);

  return (
    <PanelLayout
      title="Calendar"
      headerActions={
        <Button onClick={() => setShowForm(true)} style={{ padding: '6px 12px', fontSize: 13 }}>
          + New
        </Button>
      }
      listContent={
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
            <button onClick={() => setMonthOffset((m) => m - 1)} style={{ background: 'none', border: 'none', fontSize: 16 }}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {from.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => setMonthOffset((m) => m + 1)} style={{ background: 'none', border: 'none', fontSize: 16 }}>›</button>
          </div>
          {events.map((ev, i) => (
            <div
              key={`${ev._id}-${i}`}
              onClick={() => setSelected(ev)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--color-border)',
                background: selected?._id === ev._id ? 'var(--color-bg)' : 'transparent',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14 }}>{ev.title}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                {fmtDate(ev.occurrenceDate)} · {ev.startTime}–{ev.endTime}
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>No events this month.</div>
          )}
        </div>
      }
      detailContent={
        selected ? (
          <div style={{ padding: 32, maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{selected.title}</h2>
              <ShareButton itemType="event" itemId={selected._id} />
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 6 }}>
              {fmtDate(selected.occurrenceDate)} · {selected.startTime}–{selected.endTime}
              {selected.recurrence?.type !== 'none' && ` · Repeats ${selected.recurrence.type}`}
            </div>
            {selected.meetingRoom && (
              <div style={{ fontSize: 13, marginTop: 6, color: 'var(--color-text-muted)' }}>📍 {selected.meetingRoom}</div>
            )}
            {selected.description && (
              <p style={{ marginTop: 16, lineHeight: 1.6, color: 'var(--color-text-muted)' }}>{selected.description}</p>
            )}

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Attendees</div>
              {selected.attendees?.map((a) => (
                <div key={a.member._id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Avatar name={a.member.name} src={a.member.avatar} size={26} />
                  <span style={{ fontSize: 13, flex: 1 }}>{a.member.name}</span>
                  <Badge>{a.rsvp}</Badge>
                </div>
              ))}
            </div>

            {selected.attendees?.some((a) => a.member._id === user._id) && (
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <Button variant="success" onClick={() => rsvp(selected._id, 'Accepted')}>Accept</Button>
                <Button variant="danger" onClick={() => rsvp(selected._id, 'Declined')}>Decline</Button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState icon="📅" title="Select an event" subtitle="Choose an event from the list to view details" />
        )
      }
    >
      {showForm && (
        <Modal title="New Event" onClose={() => setShowForm(false)} width={480}>
          <form onSubmit={submit}>
            <Field label="Title">
              <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>
            <Field label="Description">
              <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div style={{ display: 'flex', gap: 10 }}>
              <Field label="Date">
                <input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </Field>
              <Field label="Start">
                <input type="time" style={inputStyle} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
              </Field>
              <Field label="End">
                <input type="time" style={inputStyle} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
              </Field>
            </div>
            <Field label="Repeat">
              <select style={inputStyle} value={form.recurrenceType} onChange={(e) => setForm({ ...form, recurrenceType: e.target.value })}>
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </Field>
            {form.recurrenceType !== 'none' && (
              <Field label="Repeat until">
                <input type="date" style={inputStyle} value={form.recurrenceEndDate} onChange={(e) => setForm({ ...form, recurrenceEndDate: e.target.value })} />
              </Field>
            )}
            <Field label="Meeting room (optional)">
              <input style={inputStyle} value={form.meetingRoom} onChange={(e) => setForm({ ...form, meetingRoom: e.target.value })} placeholder="e.g. Room 2A" />
            </Field>
            <Field label="Attendees">
              <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, padding: 8 }}>
                {contacts.map((c) => (
                  <label key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13 }}>
                    <input type="checkbox" checked={form.attendees.includes(c._id)} onChange={() => toggleAttendee(c._id)} />
                    {c.name}
                  </label>
                ))}
              </div>
            </Field>
            <Button type="submit" style={{ width: '100%', marginTop: 8 }}>Create Event</Button>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
