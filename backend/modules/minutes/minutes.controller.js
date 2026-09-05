const Minutes = require('./minutes.model');
const Event = require('../calendar/event.model');
const { notifyMany } = require('../../shared/services/notify.service');

// POST /api/minutes
const create = async (req, res) => {
  try {
    const { title, content, linkedEvent } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title is required' });

    let sharedWith = [];
    if (linkedEvent) {
      const event = await Event.findById(linkedEvent);
      if (event) sharedWith = event.attendees.map((a) => a.member);
    }

    const minutes = await Minutes.create({ title, content, linkedEvent: linkedEvent || null, createdBy: req.user._id, sharedWith });

    if (sharedWith.length) {
      const recipients = sharedWith.filter((m) => String(m) !== String(req.user._id));
      await notifyMany(recipients, {
        type: 'event_invite',
        message: `${req.user.name} shared meeting notes: "${title}"`,
        relatedModule: 'calendar',
        relatedId: minutes._id,
      });
    }

    return res.status(201).json({ success: true, data: minutes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/minutes  (mine + shared with me)
const getAll = async (req, res) => {
  try {
    const list = await Minutes.find({ $or: [{ createdBy: req.user._id }, { sharedWith: req.user._id }] })
      .populate('createdBy', 'name avatar')
      .populate('linkedEvent', 'title date')
      .sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const minutes = await Minutes.findById(req.params.id).populate('createdBy', 'name avatar').populate('sharedWith', 'name avatar');
    if (!minutes) return res.status(404).json({ success: false, message: 'Minutes not found' });
    return res.status(200).json({ success: true, data: minutes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const minutes = await Minutes.findById(req.params.id);
    if (!minutes) return res.status(404).json({ success: false, message: 'Minutes not found' });

    const canEdit = minutes.createdBy.equals(req.user._id) || minutes.sharedWith.some((m) => m.equals(req.user._id));
    if (!canEdit) return res.status(403).json({ success: false, message: 'Not authorized' });

    ['title', 'content'].forEach((f) => { if (req.body[f] !== undefined) minutes[f] = req.body[f]; });
    await minutes.save();
    return res.status(200).json({ success: true, data: minutes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const minutes = await Minutes.findById(req.params.id);
    if (!minutes) return res.status(404).json({ success: false, message: 'Minutes not found' });
    if (!minutes.createdBy.equals(req.user._id) && !['Owner', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await minutes.deleteOne();
    return res.status(200).json({ success: true, message: 'Minutes deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { create, getAll, getById, update, remove };
