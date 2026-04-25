const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createNotification,
  getMyNotifications,
  markAsRead,
  getAllNotifications,
  deleteNotification
} = require('../controllers/notificationController');

router.post('/', protect, adminOnly, createNotification);
router.get('/my-notifications', protect, getMyNotifications);
router.put('/read/:id', protect, markAsRead);
router.get('/', protect, adminOnly, getAllNotifications);
router.delete('/:id', protect, adminOnly, deleteNotification);

module.exports = router;