const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getConversations,
  getChatHistory,
  markAsRead
} = require('../controllers/chatController');

router.post('/send', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/history/:userId', protect, getChatHistory);
router.put('/read/:messageId', protect, markAsRead);

module.exports = router;