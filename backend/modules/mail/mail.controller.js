const Email = require('./mail.model');

// POST /api/mail  (send, or save as draft if status: 'draft')
const send = async (req, res) => {
  try {
    const { to, subject, body, status } = req.body;
    if (!to || !to.length) return res.status(400).json({ success: false, message: 'At least one recipient required' });

    const email = await Email.create({
      from: req.user._id,
      to,
      subject,
      body,
      status: status === 'draft' ? 'draft' : 'sent',
      attachments: req.files ? req.files.map((f) => ({ url: f.path, filename: f.originalname })) : [],
    });
    return res.status(201).json({ success: true, data: email });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/mail/inbox
const getInbox = async (req, res) => {
  try {
    const emails = await Email.find({ to: req.user._id, status: 'sent' }).populate('from', 'name avatar').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: emails });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/mail/sent
const getSent = async (req, res) => {
  try {
    const emails = await Email.find({ from: req.user._id, status: 'sent' }).populate('to', 'name avatar').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: emails });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/mail/drafts
const getDrafts = async (req, res) => {
  try {
    const emails = await Email.find({ from: req.user._id, status: 'draft' }).sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, data: emails });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/mail/:id
const getById = async (req, res) => {
  try {
    const email = await Email.findById(req.params.id).populate('from', 'name avatar').populate('to', 'name avatar');
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });

    if (email.to.some((u) => u._id.equals(req.user._id)) && !email.isReadBy.includes(req.user._id)) {
      email.isReadBy.push(req.user._id);
      await email.save();
    }
    return res.status(200).json({ success: true, data: email });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { send, getInbox, getSent, getDrafts, getById };
