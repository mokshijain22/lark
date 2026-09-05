const Integration = require('./integration.model');

const KNOWN_PROVIDERS = ['jira', 'github', 'google_drive', 'trello'];

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

module.exports = { getAll, connect, disconnect, receiveWebhook };
