const express = require('express');
const router = express.Router();
const { getWorkplace, updateWorkplace } = require('./workplace.controller');
const { protect } = require('../../shared/middleware/auth.middleware');
const { allowRoles } = require('../../shared/middleware/role.middleware');

router.use(protect);

router.get('/', getWorkplace);
router.patch('/', allowRoles('Owner', 'Admin'), updateWorkplace);

module.exports = router;
