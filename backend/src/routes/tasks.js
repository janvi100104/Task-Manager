const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  updateTaskPriority,
  deleteTask,
  getTaskStats
} = require('../controllers/taskController');
const { authenticate, checkResourceOwnership } = require('../middleware/auth');
const {
  validateTask,
  validateTaskStatus,
  validateTaskPriority
} = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(checkResourceOwnership());

// Task routes
router.route('/')
  .get(getTasks)
  .post(validateTask, createTask);

router.route('/stats')
  .get(getTaskStats);

router.route('/:id')
  .get(getTask)
  .put(validateTask, updateTask)
  .delete(deleteTask);

router.route('/:id/status')
  .patch(validateTaskStatus, updateTaskStatus);

router.route('/:id/priority')
  .patch(validateTaskPriority, updateTaskPriority);

module.exports = router;