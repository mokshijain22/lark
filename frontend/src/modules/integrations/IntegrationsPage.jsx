import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../shared/api/client';
import { useAuth } from '../../shared/context/AuthContext';
import Button from '../../shared/components/Button';

import { Layers, GitBranch, HardDrive, Kanban, Mail } from 'lucide-react';

const providerLabels = { jira: 'Jira', github: 'GitHub', google_drive: 'Google Drive', google: 'Gmail', trello: 'Trello' };
const providerIcons = { jira: Layers, github: GitBranch, google_drive: HardDrive, google: Mail, trello: Kanban };

export default function IntegrationsPage() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const isPrivileged = ['Owner', 'Admin'].includes(user?.role);

  const load = async () => {
    const res = await client.get('/integrations');
    setList(res.data.data);
  };
  useEffect(() => { load(); }, []);

  const OAUTH_PROVIDERS = ['github', 'google', 'google_drive', 'jira', 'trello'];

  const toggle = async (provider, isConnected) => {
    if (OAUTH_PROVIDERS.includes(provider) && !isConnected) {
      const token = localStorage.getItem('nook_token');
      window.location.href = `${client.defaults.baseURL}/integrations/${provider}/connect?token=${token}`;
      return;
    }
    await client.post(`/integrations/${provider}/${isConnected ? 'disconnect' : 'connect'}`);
    load();
  };

  return (
    <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Integrations</h2>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Connect external tools so their activity shows up in Nook. Each provider needs its own API credentials set in the backend's <code>.env</code> before "Connect" will work — see the README.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((i) => (
          <div key={i.provider} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, border: '1px solid var(--color-border)', borderRadius: 10, background: 'var(--color-surface)' }}>
            {(() => { const ProviderIcon = providerIcons[i.provider]; return <ProviderIcon size={22} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />; })()}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{providerLabels[i.provider]}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{i.isConnected ? `Connected ${i.connectedAt ? new Date(i.connectedAt).toLocaleDateString() : ''}` : 'Not connected'}</div>
            </div>
            {i.provider === 'google' && i.isConnected && (
              <Link to="/integrations/gmail">
                <Button variant="secondary" style={{ fontSize: 12, padding: '6px 14px' }}>View Inbox</Button>
              </Link>
            )}
            {isPrivileged && (
              <Button variant={i.isConnected ? 'danger' : 'primary'} onClick={() => toggle(i.provider, i.isConnected)} style={{ fontSize: 12, padding: '6px 14px' }}>
                {i.isConnected ? 'Disconnect' : 'Connect'}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
