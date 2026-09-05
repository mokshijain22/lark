const express = require('express');
const router = express.Router();
const { create, getAll, toggleActive, remove } = require('./automation.controller');
const { protect } = require('../../shared/middleware/auth.middleware');
const { allowRoles } = require('../../shared/middleware/role.middleware');

router.use(protect);

router.post('/', allowRoles('Owner', 'Admin'), create);
router.get('/', getAll);
router.patch('/:id/toggle', allowRoles('Owner', 'Admin'), toggleActive);
router.delete('/:id', allowRoles('Owner', 'Admin'), remove);

module.exports = router;
