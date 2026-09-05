const Okr = require('./okr.model');

const create = async (req, res) => {
  try {
    const { title, description, ownerType, keyResults, quarter, linkedDocument, linkedTask } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title is required' });
    const okr = await Okr.create({ title, description, ownerType, keyResults, quarter, linkedDocument, linkedTask, owner: req.user._id });
    return res.status(201).json({ success: true, data: okr });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/okr  -> dashboard: everyone's OKRs overview
const getAll = async (req, res) => {
  try {
    const { quarter, owner } = req.query;
    const filter = {};
    if (quarter) filter.quarter = quarter;
    if (owner) filter.owner = owner;
    const list = await Okr.find(filter).populate('owner', 'name avatar').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const okr = await Okr.findById(req.params.id).populate('owner', 'name avatar');
    if (!okr) return res.status(404).json({ success: false, message: 'OKR not found' });
    return res.status(200).json({ success: true, data: okr });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const okr = await Okr.findById(req.params.id);
    if (!okr) return res.status(404).json({ success: false, message: 'OKR not found' });
    const isPrivileged = ['Owner', 'Admin'].includes(req.user.role);
    if (!okr.owner.equals(req.user._id) && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    ['title', 'description', 'keyResults', 'quarter', 'linkedDocument', 'linkedTask'].forEach((f) => {
      if (req.body[f] !== undefined) okr[f] = req.body[f];
    });
    await okr.save();
    return res.status(200).json({ success: true, data: okr });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/okr/:id/key-results/:krId  { currentValue }
const updateKeyResultProgress = async (req, res) => {
  try {
    const okr = await Okr.findById(req.params.id);
    if (!okr) return res.status(404).json({ success: false, message: 'OKR not found' });
    const kr = okr.keyResults.id(req.params.krId);
    if (!kr) return res.status(404).json({ success: false, message: 'Key result not found' });
    kr.currentValue = req.body.currentValue;
    await okr.save();
    return res.status(200).json({ success: true, data: okr });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const okr = await Okr.findById(req.params.id);
    if (!okr) return res.status(404).json({ success: false, message: 'OKR not found' });
    const isPrivileged = ['Owner', 'Admin'].includes(req.user.role);
    if (!okr.owner.equals(req.user._id) && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await okr.deleteOne();
    return res.status(200).json({ success: true, message: 'OKR deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { create, getAll, getById, update, updateKeyResultProgress, remove };
