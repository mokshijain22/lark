const express = require('express');
const router = express.Router();
const { send, getInbox, getSent, getDrafts, getById } = require('./mail.controller');
const { protect } = require('../../shared/middleware/auth.middleware');
const upload = require('../../shared/middleware/upload.middleware');

router.use(protect);

router.post('/', upload.array('attachments', 5), send);
router.get('/inbox', getInbox);
router.get('/sent', getSent);
router.get('/drafts', getDrafts);
router.get('/:id', getById);

module.exports = router;
