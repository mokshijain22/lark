const express = require('express');
const router = express.Router();
const { getContacts, getContactById, changeRole, updateAvatar } = require('./contact.controller');
const { protect } = require('../../shared/middleware/auth.middleware');
const { allowRoles } = require('../../shared/middleware/role.middleware');
const upload = require('../../shared/middleware/upload.middleware');

router.use(protect); // all contact routes require login

router.get('/', getContacts);
router.get('/:id', getContactById);
router.patch('/me/avatar', upload.single('avatar'), updateAvatar);
router.patch('/:id/role', allowRoles('Owner', 'Admin'), changeRole);

module.exports = router;
