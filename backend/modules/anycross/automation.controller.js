const Automation = require('./automation.model');

// POST /api/anycross
const create = async (req, res) => {
  try {
    const { name, trigger, action } = req.body;
    if (!name || !trigger || !action) return res.status(400).json({ success: false, message: 'name, trigger and action are required' });
    const rule = await Automation.create({ name, trigger, action, createdBy: req.user._id });
    return res.status(201).json({ success: true, data: rule });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const rules = await Automation.find().populate('createdBy', 'name avatar').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: rules });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const toggleActive = async (req, res) => {
  try {
    const rule = await Automation.findById(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Automation not found' });
    rule.isActive = !rule.isActive;
    await rule.save();
    return res.status(200).json({ success: true, data: rule });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const rule = await Automation.findById(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Automation not found' });
    await rule.deleteOne();
    return res.status(200).json({ success: true, message: 'Automation deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { create, getAll, toggleActive, remove };

// NOTE: The trigger.module === 'approvals' case is fired from
// approval.controller.js#submitRequest in a future wiring pass (kept decoupled
// here since Approvals shouldn't hard-depend on Anycross). The 'schedule' case
// needs a cron runner (e.g. node-cron) — not wired yet, this just stores the rule.
