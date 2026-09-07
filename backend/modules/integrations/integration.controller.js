const jwt = require('jsonwebtoken');
const Integration = require('./integration.model');

const KNOWN_PROVIDERS = ['jira', 'github', 'google_drive', 'google', 'trello'];

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
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
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

module.exports = { getAll, connect, disconnect, receiveWebhook, githubConnect, githubCallback, googleConnect, googleCallback, getGoogleMessages };
