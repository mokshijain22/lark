const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getHistory, getLeaveBalance } = require('./attendance.controller');
const { protect } = require('../../shared/middleware/auth.middleware');

router.use(protect);

router.post('/checkin', checkIn);
router.post('/checkout', checkOut);
router.get('/history', getHistory);
router.get('/leave-balance', getLeaveBalance);

module.exports = router;
