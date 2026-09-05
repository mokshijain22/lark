const express = require('express');
const router = express.Router();
const { create, getAll, getById, update, updateKeyResultProgress, remove } = require('./okr.controller');
const { protect } = require('../../shared/middleware/auth.middleware');

router.use(protect);

router.post('/', create);
router.get('/', getAll);
router.get('/:id', getById);
router.patch('/:id', update);
router.patch('/:id/key-results/:krId', updateKeyResultProgress);
router.delete('/:id', remove);

module.exports = router;
