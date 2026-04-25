const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createTask,
  getMyTasks,
  getAllTasks,
  updateTaskStatus,
  deleteTask
} = require('../controllers/taskController');

router.post('/', protect, adminOnly, createTask);
router.get('/my-tasks', protect, getMyTasks);
router.get('/', protect, adminOnly, getAllTasks);
router.put('/:id/status', protect, updateTaskStatus);
router.delete('/:id', protect, adminOnly, deleteTask);

module.exports = router;