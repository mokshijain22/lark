const express = require('express');
const router = express.Router();
const {
  createTable, getTables, getTableById, updateColumns,
  addRow, updateRow, deleteRow, createView, createAutomation, deleteTable,
} = require('./base.controller');
const { protect } = require('../../shared/middleware/auth.middleware');

router.use(protect);

router.post('/tables', createTable);
router.get('/tables', getTables);
router.get('/tables/:id', getTableById);
router.patch('/tables/:id/columns', updateColumns);
router.post('/tables/:id/rows', addRow);
router.patch('/tables/:id/rows/:rowId', updateRow);
router.delete('/tables/:id/rows/:rowId', deleteRow);
router.post('/tables/:id/views', createView);
router.post('/tables/:id/automations', createAutomation);
router.delete('/tables/:id', deleteTable);

module.exports = router;
