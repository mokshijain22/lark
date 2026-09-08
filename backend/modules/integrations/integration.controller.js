const jwt = require('jsonwebtoken');
const Integration = require('./integration.model');

const KNOWN_PROVIDERS = ['jira', 'github', 'google_drive', 'google', 'trello'];
const OAUTH_PROVIDERS = ['github', 'google', 'google_drive', 'jira', 'trello']; // these use real redirect flows, not the generic fake connect below

// GET /api/integrations  -> list of all providers with connection status
const getAll = async (req, res) => {
  try {
    const existing = await Integration.find();
    const byProvider = Object.fromEntries(existing.map((i) => [i.provider, i]));

    // Ensure every known provider shows up, even if never connected
    const list = KNOWN_PROVIDERS.map((p) => byProvider[p] || { provider: p, isConnected: false });
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/integrations/:provider/connect  (Admin panel action - real OAuth flow to be added later)
const connect = async (req, res) => {
  try {
    const { provider } = req.params;
    if (!KNOWN_PROVIDERS.includes(provider)) return res.status(400).json({ success: false, message: 'Unknown provider' });
    if (OAUTH_PROVIDERS.includes(provider)) {
      return res.status(400).json({ success: false, message: `${provider} uses the OAuth connect flow, not this endpoint` });
    }

    const integration = await Integration.findOneAndUpdate(
      { provider },
      { provider, isConnected: true, connectedBy: req.user._id, connectedAt: new Date() },
      { upsert: true, new: true }
    );
    return res.status(200).json({ success: true, data: integration });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/integrations/:provider/disconnect
const disconnect = async (req, res) => {
  try {
    const integration = await Integration.findOneAndUpdate(
      { provider: req.params.provider },
      { isConnected: false, accessToken: null, connectedAt: null },
      { new: true }
    );
    return res.status(200).json({ success: true, data: integration });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/integrations/github/connect?token=<jwt>  (redirect flow - browser nav can't send Authorization header)
const githubConnect = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(401).send('Missing auth token');
    jwt.verify(token, process.env.JWT_SECRET); // just validating it's a real logged-in user before redirecting

    const state = jwt.sign({ token, provider: 'github' }, process.env.JWT_SECRET, { expiresIn: '10m' });
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: process.env.GITHUB_CALLBACK_URL,
      scope: 'read:user repo',
      state,
    });
    return res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  } catch (err) {
    return res.status(401).send('Invalid or expired session, please log in again');
  }
};

// GET /api/integrations/github/callback  (GitHub redirects here with ?code=&state=)
const githubCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    const { code, state } = req.query;
    const decodedState = jwt.verify(state, process.env.JWT_SECRET);
    const userPayload = jwt.verify(decodedState.token, process.env.JWT_SECRET);

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(tokenData.error_description || 'No access token returned');

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'Nook-App' },
    });
    const githubUser = await userRes.json();

    await Integration.findOneAndUpdate(
      { provider: 'github' },
      {
        provider: 'github',
        isConnected: true,
        connectedBy: userPayload.id,
        connectedAt: new Date(),
        accessToken: tokenData.access_token,
        providerUserId: String(githubUser.id),
        providerUsername: githubUser.login,
      },
      { upsert: true, new: true }
    );

    return res.redirect(`${clientUrl}/integrations?connected=github`);
  } catch (err) {
    return res.redirect(`${clientUrl}/integrations?error=${encodeURIComponent(err.message)}`);
  }
};

// GET /api/integrations/google/connect?token=<jwt>  (redirect flow - browser nav can't send Authorization header)
const googleConnect = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(401).send('Missing auth token');
    jwt.verify(token, process.env.JWT_SECRET); // just validating it's a real logged-in user before redirecting

    const state = jwt.sign({ token, provider: 'google' }, process.env.JWT_SECRET, { expiresIn: '10m' });
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email',
      state,
    });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (err) {
    return res.status(401).send('Invalid or expired session, please log in again');
  }
};

// GET /api/integrations/google/callback  (Google redirects here with ?code=&state=)
const googleCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    const { code, state } = req.query;
    const decodedState = jwt.verify(state, process.env.JWT_SECRET);
    const userPayload = jwt.verify(decodedState.token, process.env.JWT_SECRET);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(tokenData.error_description || 'No access token returned');

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    await Integration.findOneAndUpdate(
      { provider: 'google' },
      {
        provider: 'google',
        isConnected: true,
        connectedBy: userPayload.id,
        connectedAt: new Date(),
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token, // only present on first consent, so don't overwrite with undefined on reconnect
        providerUserId: googleUser.id,
        providerUsername: googleUser.email,
      },
      { upsert: true, new: true }
    );

    return res.redirect(`${clientUrl}/integrations?connected=google`);
  } catch (err) {
    return res.redirect(`${clientUrl}/integrations?error=${encodeURIComponent(err.message)}`);
  }
};

// GET /api/integrations/google/messages  (fetch last 10 Gmail messages for the connected account)
const getGoogleMessages = async (req, res) => {
  try {
    const integration = await Integration.findOne({ provider: 'google', isConnected: true }).select('+accessToken +refreshToken');
    if (!integration) return res.status(404).json({ success: false, message: 'Gmail not connected' });

    const fetchGmail = async (accessToken) => {
      const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=INBOX', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return listRes;
    };

    let accessToken = integration.accessToken;
    let listRes = await fetchGmail(accessToken);

    // Access token expired -> use refresh token to get a new one, then retry once.
    if (listRes.status === 401 && integration.refreshToken) {
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: integration.refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      const refreshData = await refreshRes.json();
      if (!refreshData.access_token) throw new Error('Gmail session expired, please reconnect');

      accessToken = refreshData.access_token;
      integration.accessToken = accessToken;
      await integration.save();

      listRes = await fetchGmail(accessToken);
    }

    const listData = await listRes.json();
    if (!listData.messages) return res.status(200).json({ success: true, data: [] });

    // Gmail's list endpoint only returns IDs, so fetch metadata for each message.
    const messages = await Promise.all(
      listData.messages.map(async (m) => {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const msgData = await msgRes.json();
        const headers = Object.fromEntries((msgData.payload?.headers || []).map((h) => [h.name, h.value]));
        return {
          id: msgData.id,
          from: headers.From || 'Unknown sender',
          subject: headers.Subject || '(no subject)',
          snippet: msgData.snippet || '',
          date: headers.Date || null,
          isUnread: (msgData.labelIds || []).includes('UNREAD'),
        };
      })
    );

    return res.status(200).json({ success: true, data: messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/integrations/google/send  (body: { to, subject, body, cc?, bcc? })
const sendGoogleMessage = async (req, res) => {
  try {
    const { to, subject, body, cc, bcc } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, message: 'to, subject, and body are required' });
    }

    const integration = await Integration.findOne({ provider: 'google', isConnected: true }).select('+accessToken +refreshToken');
    if (!integration) return res.status(404).json({ success: false, message: 'Gmail not connected' });

    const headerLines = [`To: ${to}`, `Subject: ${subject}`, 'Content-Type: text/plain; charset="UTF-8"'];
    if (cc) headerLines.push(`Cc: ${cc}`);
    if (bcc) headerLines.push(`Bcc: ${bcc}`);
    const rawMessage = `${headerLines.join('\r\n')}\r\n\r\n${body}`;
    const encodedMessage = Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const sendGmail = async (accessToken) =>
      fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: encodedMessage }),
      });

    let accessToken = integration.accessToken;
    let sendRes = await sendGmail(accessToken);

    if (sendRes.status === 401 && integration.refreshToken) {
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: integration.refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      const refreshData = await refreshRes.json();
      if (!refreshData.access_token) throw new Error('Gmail session expired, please reconnect');

      accessToken = refreshData.access_token;
      integration.accessToken = accessToken;
      await integration.save();

      sendRes = await sendGmail(accessToken);
    }

    if (!sendRes.ok) {
      const errData = await sendRes.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'Failed to send message - you may need to reconnect Gmail to grant send permission');
    }

    const sendData = await sendRes.json();
    return res.status(200).json({ success: true, data: sendData });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/integrations/google_drive/connect?token=<jwt>  (separate provider entry, drive scope only)
const googleDriveConnect = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(401).send('Missing auth token');
    jwt.verify(token, process.env.JWT_SECRET);

    const state = jwt.sign({ token, provider: 'google_drive' }, process.env.JWT_SECRET, { expiresIn: '10m' });
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_DRIVE_CALLBACK_URL,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email',
      state,
    });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (err) {
    return res.status(401).send('Invalid or expired session, please log in again');
  }
};

// GET /api/integrations/google_drive/callback
const googleDriveCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    const { code, state } = req.query;
    const decodedState = jwt.verify(state, process.env.JWT_SECRET);
    const userPayload = jwt.verify(decodedState.token, process.env.JWT_SECRET);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GOOGLE_DRIVE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(tokenData.error_description || 'No access token returned');

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    await Integration.findOneAndUpdate(
      { provider: 'google_drive' },
      {
        provider: 'google_drive',
        isConnected: true,
        connectedBy: userPayload.id,
        connectedAt: new Date(),
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        providerUserId: googleUser.id,
        providerUsername: googleUser.email,
      },
      { upsert: true, new: true }
    );

    return res.redirect(`${clientUrl}/integrations?connected=google_drive`);
  } catch (err) {
    return res.redirect(`${clientUrl}/integrations?error=${encodeURIComponent(err.message)}`);
  }
};

// GET /api/integrations/google_drive/files  (last 10 files the connected account can see)
const getDriveFiles = async (req, res) => {
  try {
    const integration = await Integration.findOne({ provider: 'google_drive', isConnected: true }).select('+accessToken +refreshToken');
    if (!integration) return res.status(404).json({ success: false, message: 'Google Drive not connected' });

    const fetchFiles = async (accessToken) =>
      fetch('https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType,webViewLink,modifiedTime)&orderBy=modifiedTime desc', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

    let accessToken = integration.accessToken;
    let filesRes = await fetchFiles(accessToken);

    if (filesRes.status === 401 && integration.refreshToken) {
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: integration.refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      const refreshData = await refreshRes.json();
      if (!refreshData.access_token) throw new Error('Drive session expired, please reconnect');

      accessToken = refreshData.access_token;
      integration.accessToken = accessToken;
      await integration.save();

      filesRes = await fetchFiles(accessToken);
    }

    const filesData = await filesRes.json();
    return res.status(200).json({ success: true, data: filesData.files || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/integrations/jira/connect?token=<jwt>  (Atlassian OAuth 2.0 3LO)
const jiraConnect = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(401).send('Missing auth token');
    jwt.verify(token, process.env.JWT_SECRET);

    const state = jwt.sign({ token, provider: 'jira' }, process.env.JWT_SECRET, { expiresIn: '10m' });
    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: process.env.JIRA_CLIENT_ID,
      scope: 'read:jira-work read:jira-user offline_access',
      redirect_uri: process.env.JIRA_CALLBACK_URL,
      state,
      response_type: 'code',
      prompt: 'consent',
    });
    return res.redirect(`https://auth.atlassian.com/authorize?${params.toString()}`);
  } catch (err) {
    return res.status(401).send('Invalid or expired session, please log in again');
  }
};

// GET /api/integrations/jira/callback
const jiraCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    const { code, state } = req.query;
    const decodedState = jwt.verify(state, process.env.JWT_SECRET);
    const userPayload = jwt.verify(decodedState.token, process.env.JWT_SECRET);

    const tokenRes = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.JIRA_CLIENT_ID,
        client_secret: process.env.JIRA_CLIENT_SECRET,
        code,
        redirect_uri: process.env.JIRA_CALLBACK_URL,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(tokenData.error_description || 'No access token returned');

    // Jira Cloud calls are made against a site's cloudId, not a fixed domain, so look it up.
    const resourcesRes = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json' },
    });
    const resources = await resourcesRes.json();
    const site = resources?.[0];
    if (!site) throw new Error('No accessible Jira site found for this account');

    const userRes = await fetch('https://api.atlassian.com/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const jiraUser = await userRes.json();

    await Integration.findOneAndUpdate(
      { provider: 'jira' },
      {
        provider: 'jira',
        isConnected: true,
        connectedBy: userPayload.id,
        connectedAt: new Date(),
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        providerUserId: jiraUser.account_id,
        providerUsername: jiraUser.email || jiraUser.name,
        cloudId: site.id,
        siteUrl: site.url,
      },
      { upsert: true, new: true }
    );

    return res.redirect(`${clientUrl}/integrations?connected=jira`);
  } catch (err) {
    return res.redirect(`${clientUrl}/integrations?error=${encodeURIComponent(err.message)}`);
  }
};

// GET /api/integrations/jira/projects  (list projects on the connected site)
const getJiraProjects = async (req, res) => {
  try {
    const integration = await Integration.findOne({ provider: 'jira', isConnected: true }).select('+accessToken +refreshToken');
    if (!integration) return res.status(404).json({ success: false, message: 'Jira not connected' });

    const fetchProjects = async (accessToken) =>
      fetch(`https://api.atlassian.com/ex/jira/${integration.cloudId}/rest/api/3/project/search`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      });

    let accessToken = integration.accessToken;
    let projRes = await fetchProjects(accessToken);

    if (projRes.status === 401 && integration.refreshToken) {
      const refreshRes = await fetch('https://auth.atlassian.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: process.env.JIRA_CLIENT_ID,
          client_secret: process.env.JIRA_CLIENT_SECRET,
          refresh_token: integration.refreshToken,
        }),
      });
      const refreshData = await refreshRes.json();
      if (!refreshData.access_token) throw new Error('Jira session expired, please reconnect');

      accessToken = refreshData.access_token;
      integration.accessToken = accessToken;
      // Atlassian rotates the refresh token on every use, so the old one stops working.
      if (refreshData.refresh_token) integration.refreshToken = refreshData.refresh_token;
      await integration.save();

      projRes = await fetchProjects(accessToken);
    }

    const projData = await projRes.json();
    return res.status(200).json({ success: true, data: projData.values || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/integrations/trello/connect?token=<jwt>
// Trello's OAuth is a client-side "simple" flow: it returns the token in a URL
// fragment (never sent to a server), so we redirect to a frontend page that
// reads the fragment and POSTs it back to us on /trello/save-token.
const trelloConnect = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(401).send('Missing auth token');
    jwt.verify(token, process.env.JWT_SECRET);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const params = new URLSearchParams({
      key: process.env.TRELLO_API_KEY,
      name: 'Nook',
      scope: 'read',
      expiration: 'never',
      response_type: 'token',
      callback_method: 'fragment',
      return_url: `${clientUrl}/integrations/trello/callback`,
    });
    return res.redirect(`https://trello.com/1/authorize?${params.toString()}`);
  } catch (err) {
    return res.status(401).send('Invalid or expired session, please log in again');
  }
};

// POST /api/integrations/trello/save-token  (body: { trelloToken })  - called by the frontend callback page
const trelloSaveToken = async (req, res) => {
  try {
    const { trelloToken } = req.body;
    if (!trelloToken) return res.status(400).json({ success: false, message: 'Missing trelloToken' });

    const meRes = await fetch(`https://api.trello.com/1/members/me?key=${process.env.TRELLO_API_KEY}&token=${trelloToken}`);
    const me = await meRes.json();
    if (!me.id) throw new Error('Could not verify Trello token');

    const integration = await Integration.findOneAndUpdate(
      { provider: 'trello' },
      {
        provider: 'trello',
        isConnected: true,
        connectedBy: req.user._id,
        connectedAt: new Date(),
        accessToken: trelloToken, // Trello calls this a "token"; stored in the generic accessToken field
        providerUserId: me.id,
        providerUsername: me.username,
      },
      { upsert: true, new: true }
    );
    return res.status(200).json({ success: true, data: integration });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/integrations/trello/boards
const getTrelloBoards = async (req, res) => {
  try {
    const integration = await Integration.findOne({ provider: 'trello', isConnected: true }).select('+accessToken');
    if (!integration) return res.status(404).json({ success: false, message: 'Trello not connected' });

    const boardsRes = await fetch(
      `https://api.trello.com/1/members/me/boards?key=${process.env.TRELLO_API_KEY}&token=${integration.accessToken}&fields=name,url,closed`
    );
    const boards = await boardsRes.json();
    return res.status(200).json({ success: true, data: (boards || []).filter((b) => !b.closed) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/integrations/:provider/webhook  (generic inbound webhook -> creates a Notification)
const { notifyMany } = require('../../shared/services/notify.service');
const OrgMember = require('../../shared/models/OrgMember');
const receiveWebhook = async (req, res) => {
  try {
    const { provider } = req.params;
    const integration = await Integration.findOne({ provider, isConnected: true });
    if (!integration) return res.status(404).json({ success: false, message: 'Integration not connected' });

    // Notify Admins/Owners that something happened on the connected tool.
    const admins = await OrgMember.find({ role: { $in: ['Owner', 'Admin'] } }).select('_id');
    await notifyMany(admins.map((a) => a._id), {
      type: 'approval_request', // reused generic type for MVP
      message: `New activity from ${provider}: ${req.body.summary || 'see connected tool for details'}`,
      relatedModule: 'approvals',
      relatedId: integration._id,
    });
    return res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAll,
  connect,
  disconnect,
  receiveWebhook,
  githubConnect,
  githubCallback,
  googleConnect,
  googleCallback,
  getGoogleMessages,
  sendGoogleMessage,
  googleDriveConnect,
  googleDriveCallback,
  getDriveFiles,
  jiraConnect,
  jiraCallback,
  getJiraProjects,
  trelloConnect,
  trelloSaveToken,
  getTrelloBoards,
};
