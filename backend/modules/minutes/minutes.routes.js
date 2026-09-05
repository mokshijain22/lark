const express = require('express');
const router = express.Router();
const { create, getAll, getById, update, remove } = require('./minutes.controller');
const { protect } = require('../../shared/middleware/auth.middleware');

router.use(protect);

router.post('/', create);
router.get('/', getAll);
router.get('/:id', getById);
router.patch('/:id', update);
router.delete('/:id', remove);

module.exports = router;
