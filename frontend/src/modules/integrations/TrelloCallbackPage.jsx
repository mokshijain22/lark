import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../shared/api/client';

// Trello's simple OAuth flow returns the token in the URL fragment (#token=...),
// which browsers never send to a server, so this page grabs it client-side and
// hands it to the backend to verify + store against the connected provider.
export default function TrelloCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Connecting Trello...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const trelloToken = params.get('token');

    if (!trelloToken) {
      setStatus('No token returned by Trello.');
      setTimeout(() => navigate('/integrations?error=trello_no_token'), 1500);
      return;
    }

    client
      .post('/integrations/trello/save-token', { trelloToken })
      .then(() => navigate('/integrations?connected=trello'))
      .catch((err) => {
        setStatus(err.response?.data?.message || 'Failed to save Trello token.');
        setTimeout(() => navigate('/integrations?error=trello_save_failed'), 1500);
      });
  }, [navigate]);

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{status}</p>
    </div>
  );
}
