const express = require('express');
const router = express.Router();
const { translateText, setPreferredLanguage } = require('./translation.controller');
const { protect } = require('../../shared/middleware/auth.middleware');

router.use(protect);

router.post('/translate', translateText);
router.patch('/preference', setPreferredLanguage);

module.exports = router;
