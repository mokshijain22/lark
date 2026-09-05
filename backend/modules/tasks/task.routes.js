const express = require('express');
const router = express.Router();
const {
  createTask,
  getAssignedToMe,
  getCreatedByMe,
  getTaskById,
  updateTask,
  deleteTask,
} = require('./task.controller');
const { protect } = require('../../shared/middleware/auth.middleware');

router.use(protect);

router.post('/', createTask);
router.get('/assigned-to-me', getAssignedToMe);
router.get('/created-by-me', getCreatedByMe);
router.get('/:id', getTaskById);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
