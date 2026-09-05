const express = require('express');
const router = express.Router();
const { getAll, connect, disconnect, receiveWebhook } = require('./integration.controller');
const { protect } = require('../../shared/middleware/auth.middleware');
const { allowRoles } = require('../../shared/middleware/role.middleware');

router.post('/:provider/webhook', receiveWebhook); // external services call this - no user auth

router.use(protect);
router.get('/', getAll);
router.post('/:provider/connect', allowRoles('Owner', 'Admin'), connect);
router.post('/:provider/disconnect', allowRoles('Owner', 'Admin'), disconnect);

module.exports = router;
