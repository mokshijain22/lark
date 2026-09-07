import { useEffect, useState } from 'react';
import client from '../api/client';
import Modal from './Modal';
import Button from './Button';
import Field, { inputStyle } from './Field';
import { Share2 } from 'lucide-react';

// Drop this into any module's detail view: <ShareButton itemType="task" itemId={task._id} />
export default function ShareButton({ itemType, itemId }) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [permission, setPermission] = useState('view');
  const [status, setStatus] = useState(null); // null | 'sharing' | 'done' | 'error'

  useEffect(() => {
    if (open) client.get('/contacts').then((res) => setContacts(res.data.data));
  }, [open]);

  const share = async (e) => {
    e.preventDefault();
    if (!memberId) return;
    setStatus('sharing');
    try {
      await client.post('/share', { itemType, itemId, sharedWith: memberId, permission });
      setStatus('done');
      setTimeout(() => { setOpen(false); setStatus(null); setMemberId(''); }, 900);
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Share2 size={13} /> Share
      </Button>

      {open && (
        <Modal title="Share" onClose={() => setOpen(false)} width={380}>
          <form onSubmit={share}>
            <Field label="Share with">
              <select style={inputStyle} value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
                <option value="">Select a person...</option>
                {contacts.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Permission">
              <select style={inputStyle} value={permission} onChange={(e) => setPermission(e.target.value)}>
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
              </select>
            </Field>
            <Button type="submit" style={{ width: '100%' }}>
              {status === 'sharing' ? 'Sharing...' : status === 'done' ? '✓ Shared' : status === 'error' ? 'Failed — try again' : 'Share'}
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
