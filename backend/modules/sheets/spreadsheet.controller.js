const Spreadsheet = require('./spreadsheet.model');
const { evaluateTab } = require('../../shared/services/formula.service');

// POST /api/sheets
const createSpreadsheet = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title is required' });
    const sheet = await Spreadsheet.create({ title, createdBy: req.user._id });
    return res.status(201).json({ success: true, data: sheet });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/sheets
const getSpreadsheets = async (req, res) => {
  try {
    const sheets = await Spreadsheet.find().select('title createdBy createdAt updatedAt').populate('createdBy', 'name avatar').sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, data: sheets });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/sheets/:id  - returns tabs with computed formula values alongside raw ones
const getSpreadsheetById = async (req, res) => {
  try {
    const sheet = await Spreadsheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ success: false, message: 'Spreadsheet not found' });

    const sheetObj = sheet.toObject();
    sheetObj.tabs = sheetObj.tabs.map((tab, i) => ({ ...tab, cells: evaluateTab(sheet.tabs[i].cells) }));

    return res.status(200).json({ success: true, data: sheetObj });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/sheets/:id/cells  { tabIndex, cells: { "A1": {...} } }  - bulk cell update
// Returns the whole tab's cells re-evaluated, since one changed cell can affect
// formulas elsewhere in the tab (e.g. a SUM range that includes it).
const updateCells = async (req, res) => {
  try {
    const { tabIndex = 0, cells } = req.body;
    const sheet = await Spreadsheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ success: false, message: 'Spreadsheet not found' });
    const tab = sheet.tabs[tabIndex];
    if (!tab) return res.status(400).json({ success: false, message: 'Invalid tab index' });

    Object.entries(cells).forEach(([ref, val]) => tab.cells.set(ref, val));
    await sheet.save();

    const evaluated = evaluateTab(tab.cells);
    return res.status(200).json({ success: true, data: { ...tab.toObject(), cells: evaluated } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/sheets/:id/tabs  (add a new sheet tab)
const addTab = async (req, res) => {
  try {
    const sheet = await Spreadsheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ success: false, message: 'Spreadsheet not found' });
    sheet.tabs.push({ name: req.body.name || `Sheet${sheet.tabs.length + 1}`, cells: {}, charts: [] });
    await sheet.save();
    return res.status(201).json({ success: true, data: sheet.tabs[sheet.tabs.length - 1] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/sheets/:id/charts  { tabIndex, chart }
const addChart = async (req, res) => {
  try {
    const { tabIndex = 0, chart } = req.body;
    const sheet = await Spreadsheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ success: false, message: 'Spreadsheet not found' });
    sheet.tabs[tabIndex].charts.push(chart);
    await sheet.save();
    return res.status(201).json({ success: true, data: sheet.tabs[tabIndex].charts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/sheets/:id
const deleteSpreadsheet = async (req, res) => {
  try {
    const sheet = await Spreadsheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ success: false, message: 'Spreadsheet not found' });
    const isPrivileged = ['Owner', 'Admin'].includes(req.user.role);
    if (!sheet.createdBy.equals(req.user._id) && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await sheet.deleteOne();
    return res.status(200).json({ success: true, message: 'Spreadsheet deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createSpreadsheet, getSpreadsheets, getSpreadsheetById, updateCells, addTab, addChart, deleteSpreadsheet };
