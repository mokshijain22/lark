const express = require('express');
const router = express.Router();
const {
  submitRequest,
  getMyRequests,
  getPendingForApprover,
  actionRequest,
  createTemplate,
  getTemplates,
} = require('./approval.controller');
const { protect } = require('../../shared/middleware/auth.middleware');
const { allowRoles } = require('../../shared/middleware/role.middleware');
const upload = require('../../shared/middleware/upload.middleware');

router.use(protect);

router.post('/', upload.single('attachment'), submitRequest);
router.get('/mine', getMyRequests);
router.get('/pending', getPendingForApprover);
router.patch('/:id/action', actionRequest);

router.post('/templates', allowRoles('Owner', 'Admin'), createTemplate);
router.get('/templates', getTemplates);

module.exports = router;
