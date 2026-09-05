import { useEffect, useState } from 'react';
import client from '../../shared/api/client';
import Avatar from '../../shared/components/Avatar';
import Badge from '../../shared/components/Badge';
import EmptyState from '../../shared/components/EmptyState';

export default function MagicSharePage() {
  const [shares, setShares] = useState([]);

  useEffect(() => {
    client.get('/share/shared-with-me').then((r) => setShares(r.data.data));
  }, []);

  return (
    <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Shared with me</h2>
      {shares.length === 0 && <EmptyState icon="🔗" title="Nothing shared yet" subtitle="Items shared with you from Docs, Sheets, Slides, Base, Calendar or Tasks will appear here" />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shares.map((s) => (
          <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: '1px solid var(--color-border)', borderRadius: 10, background: 'var(--color-surface)' }}>
            <Avatar name={s.sharedBy?.name} src={s.sharedBy?.avatar} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{s.previewTitle}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Shared by {s.sharedBy?.name} · {s.itemType} · last edited {new Date(s.previewLastEditedAt).toLocaleDateString()}
              </div>
            </div>
            <Badge>{s.permission}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
