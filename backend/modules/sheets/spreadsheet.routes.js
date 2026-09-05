const express = require('express');
const router = express.Router();
const {
  createSpreadsheet, getSpreadsheets, getSpreadsheetById,
  updateCells, addTab, addChart, deleteSpreadsheet,
} = require('./spreadsheet.controller');
const { protect } = require('../../shared/middleware/auth.middleware');

router.use(protect);

router.post('/', createSpreadsheet);
router.get('/', getSpreadsheets);
router.get('/:id', getSpreadsheetById);
router.patch('/:id/cells', updateCells);
router.post('/:id/tabs', addTab);
router.post('/:id/charts', addChart);
router.delete('/:id', deleteSpreadsheet);

module.exports = router;
