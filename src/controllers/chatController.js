const Chat = require('../models/Chat');

// Send message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    
    const chat = await Chat.create({
      senderId: req.user._id,
      receiverId,
      message
    });
    
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Chat.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user._id },
            { receiverId: req.user._id }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', req.user._id] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $last: '$message' },
          lastMessageTime: { $last: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiverId', req.user._id] },
                  { $eq: ['$isRead', false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      }
    ]).sort({ lastMessageTime: -1 });
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get chat history
const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const messages = await Chat.find({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id }
      ]
    }).sort({ createdAt: 1 });
    
    // Mark messages as read
    await Chat.updateMany(
      { senderId: userId, receiverId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark message as read
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    await Chat.findByIdAndUpdate(messageId, {
      isRead: true,
      readAt: new Date()
    });
    
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getChatHistory,
  markAsRead
};