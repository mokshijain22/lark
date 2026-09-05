import { useEffect, useState } from 'react';
import client from '../../shared/api/client';
import Button from '../../shared/components/Button';
import Badge from '../../shared/components/Badge';

export default function AttendancePage() {
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState(null);

  const load = async () => {
    const [histRes, balRes] = await Promise.all([
      client.get('/attendance/history'),
      client.get('/attendance/leave-balance'),
    ]);
    setHistory(histRes.data.data);
    setBalance(balRes.data.data);
    const todayStr = new Date().toISOString().slice(0, 10);
    setToday(histRes.data.data.find((h) => h.date === todayStr) || null);
  };
  useEffect(() => { load(); }, []);

  const checkIn = async () => { await client.post('/attendance/checkin'); load(); };
  const checkOut = async () => { await client.post('/attendance/checkout'); load(); };

  return (
    <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Attendance</h2>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <div style={{ flex: 1, padding: 20, border: '1px solid var(--color-border)', borderRadius: 10, background: 'var(--color-surface)' }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>Today</div>
          {today?.checkIn ? (
            <div>
              <div style={{ fontSize: 13, marginBottom: 8 }}>Checked in at {new Date(today.checkIn).toLocaleTimeString()}</div>
              {today.checkOut ? (
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Checked out at {new Date(today.checkOut).toLocaleTimeString()}</div>
              ) : (
                <Button onClick={checkOut}>Check Out</Button>
              )}
            </div>
          ) : (
            <Button onClick={checkIn}>Check In</Button>
          )}
        </div>

        <div style={{ flex: 1, padding: 20, border: '1px solid var(--color-border)', borderRadius: 10, background: 'var(--color-surface)' }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>Leave Balance</div>
          {balance && (
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{balance.remaining}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>of {balance.allotted} days remaining this year</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>History</div>
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
        {history.map((h) => (
          <div key={h._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 13 }}>{new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <Badge>{h.status}</Badge>
          </div>
        ))}
        {history.length === 0 && <div style={{ padding: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>No attendance records yet.</div>}
      </div>
    </div>
  );
}
