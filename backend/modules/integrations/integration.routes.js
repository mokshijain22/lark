const express = require('express');
const router = express.Router();
const { getAll, connect, disconnect, receiveWebhook, githubConnect, githubCallback, googleConnect, googleCallback, getGoogleMessages } = require('./integration.controller');
const { protect } = require('../../shared/middleware/auth.middleware');
const { allowRoles } = require('../../shared/middleware/role.middleware');

router.post('/:provider/webhook', receiveWebhook); // external services call this - no user auth

router.get('/github/connect', githubConnect); // token passed as query param, not header (browser redirect)
router.get('/github/callback', githubCallback); // GitHub redirects here after user authorizes

router.get('/google/connect', googleConnect); // token passed as query param, not header (browser redirect)
router.get('/google/callback', googleCallback); // Google redirects here after user authorizes

router.use(protect);
router.get('/', getAll);
router.get('/google/messages', getGoogleMessages);
router.post('/:provider/connect', allowRoles('Owner', 'Admin'), connect);
router.post('/:provider/disconnect', allowRoles('Owner', 'Admin'), disconnect);

module.exports = router;
