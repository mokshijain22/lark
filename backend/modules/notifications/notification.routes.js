const express = require('express');
const router = express.Router();
const { getAll, getUnreadCount, markAsRead, markAllAsRead } = require('./notification.controller');
const { protect } = require('../../shared/middleware/auth.middleware');

router.use(protect);

router.get('/', getAll);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

module.exports = router;
