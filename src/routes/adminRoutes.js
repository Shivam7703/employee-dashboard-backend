const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getDashboardStats,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
  getWeeklyTaskReport
} = require('../controllers/adminController');

router.get('/stats', protect, adminOnly, getDashboardStats);
router.get('/employees', protect, adminOnly, getAllEmployees);
router.put('/employees/:id', protect, adminOnly, updateEmployee);
router.delete('/employees/:id', protect, adminOnly, deleteEmployee);
router.get('/task-report', protect, adminOnly, getWeeklyTaskReport);

module.exports = router;