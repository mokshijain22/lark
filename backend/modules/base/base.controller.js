const BaseTable = require('./base.model');
const { notifyOne } = require('../../shared/services/notify.service');

// POST /api/base/tables
const createTable = async (req, res) => {
  try {
    const { name, columns } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });
    const table = await BaseTable.create({ name, columns: columns || [], createdBy: req.user._id });
    return res.status(201).json({ success: true, data: table });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/base/tables
const getTables = async (req, res) => {
  try {
    const tables = await BaseTable.find().select('-rows').populate('createdBy', 'name avatar').sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, data: tables });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/base/tables/:id  (full data with rows, supports ?view=viewId filter/sort applied client-side for MVP)
const getTableById = async (req, res) => {
  try {
    const table = await BaseTable.findById(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    return res.status(200).json({ success: true, data: table });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/base/tables/:id/columns  (add/update columns)
const updateColumns = async (req, res) => {
  try {
    const table = await BaseTable.findById(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    table.columns = req.body.columns;
    await table.save();
    return res.status(200).json({ success: true, data: table });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/base/tables/:id/rows  (add row - also used by public "Forms")
const addRow = async (req, res) => {
  try {
    const table = await BaseTable.findById(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

    table.rows.push({ data: req.body.data || {} });
    await table.save();
    const newRow = table.rows[table.rows.length - 1];

    // Simple automation: "when column X becomes value Y, notify member"
    for (const rule of table.automations) {
      if (newRow.data.get(rule.triggerColumn) === rule.triggerValue) {
        await notifyOne({
          recipient: rule.notifyMember,
          type: 'approval_actioned', // reusing generic type for MVP
          message: `Automation "${rule.name}" triggered on table "${table.name}"`,
          relatedModule: 'tasks',
          relatedId: table._id,
        });
      }
    }

    return res.status(201).json({ success: true, data: newRow });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/base/tables/:id/rows/:rowId
const updateRow = async (req, res) => {
  try {
    const table = await BaseTable.findById(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

    const row = table.rows.id(req.params.rowId);
    if (!row) return res.status(404).json({ success: false, message: 'Row not found' });

    Object.entries(req.body.data || {}).forEach(([k, v]) => row.data.set(k, v));
    await table.save();

    for (const rule of table.automations) {
      if (row.data.get(rule.triggerColumn) === rule.triggerValue) {
        await notifyOne({
          recipient: rule.notifyMember,
          type: 'approval_actioned',
          message: `Automation "${rule.name}" triggered on table "${table.name}"`,
          relatedModule: 'tasks',
          relatedId: table._id,
        });
      }
    }

    return res.status(200).json({ success: true, data: row });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/base/tables/:id/rows/:rowId
const deleteRow = async (req, res) => {
  try {
    const table = await BaseTable.findById(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    table.rows.id(req.params.rowId)?.deleteOne();
    await table.save();
    return res.status(200).json({ success: true, message: 'Row deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/base/tables/:id/views
const createView = async (req, res) => {
  try {
    const table = await BaseTable.findById(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    table.views.push(req.body);
    await table.save();
    return res.status(201).json({ success: true, data: table.views[table.views.length - 1] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/base/tables/:id/automations
const createAutomation = async (req, res) => {
  try {
    const table = await BaseTable.findById(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    table.automations.push(req.body);
    await table.save();
    return res.status(201).json({ success: true, data: table.automations[table.automations.length - 1] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/base/tables/:id
const deleteTable = async (req, res) => {
  try {
    const table = await BaseTable.findById(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    const isPrivileged = ['Owner', 'Admin'].includes(req.user.role);
    if (!table.createdBy.equals(req.user._id) && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await table.deleteOne();
    return res.status(200).json({ success: true, message: 'Table deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createTable, getTables, getTableById, updateColumns, addRow, updateRow, deleteRow, createView, createAutomation, deleteTable };
