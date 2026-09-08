const express = require('express');
const router = express.Router();
const {
  getAll,
  connect,
  disconnect,
  receiveWebhook,
  githubConnect,
  githubCallback,
  googleConnect,
  googleCallback,
  getGoogleMessages,
  sendGoogleMessage,
  googleDriveConnect,
  googleDriveCallback,
  getDriveFiles,
  jiraConnect,
  jiraCallback,
  getJiraProjects,
  trelloConnect,
  trelloSaveToken,
  getTrelloBoards,
} = require('./integration.controller');
const { protect } = require('../../shared/middleware/auth.middleware');
const { allowRoles } = require('../../shared/middleware/role.middleware');

router.post('/:provider/webhook', receiveWebhook); // external services call this - no user auth

// OAuth redirect flows: token passed as query param, not header, since these are browser navigations
router.get('/github/connect', githubConnect);
router.get('/github/callback', githubCallback); // GitHub redirects here after user authorizes

router.get('/google/connect', googleConnect);
router.get('/google/callback', googleCallback); // Google redirects here after user authorizes

router.get('/google_drive/connect', googleDriveConnect);
router.get('/google_drive/callback', googleDriveCallback);

router.get('/jira/connect', jiraConnect);
router.get('/jira/callback', jiraCallback); // Atlassian redirects here after user authorizes

router.get('/trello/connect', trelloConnect); // redirects to Trello, which then redirects to a frontend page (token comes back in a URL fragment, not to us)

router.use(protect);
router.get('/', getAll);
router.get('/google/messages', getGoogleMessages);
router.post('/google/send', sendGoogleMessage);
router.get('/google_drive/files', getDriveFiles);
router.get('/jira/projects', getJiraProjects);
router.get('/trello/boards', getTrelloBoards);
router.post('/trello/save-token', trelloSaveToken); // frontend callback page posts the fragment token here
router.post('/:provider/connect', allowRoles('Owner', 'Admin'), connect);
router.post('/:provider/disconnect', allowRoles('Owner', 'Admin'), disconnect);

module.exports = router;
