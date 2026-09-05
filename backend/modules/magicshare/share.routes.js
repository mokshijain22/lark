const express = require('express');
const router = express.Router();
const { shareItem, getSharedWithMe, updatePermission } = require('./share.controller');
const { protect } = require('../../shared/middleware/auth.middleware');

router.use(protect);

router.post('/', shareItem);
router.get('/shared-with-me', getSharedWithMe);
router.patch('/:id/permission', updatePermission);

module.exports = router;
