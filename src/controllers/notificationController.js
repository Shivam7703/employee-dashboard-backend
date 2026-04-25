const Notification = require('../models/Notification');
const User = require('../models/User');

// Create notification (Admin only)
const createNotification = async (req, res) => {
  try {
    const { title, message, type, targetUsers, isGlobal, date } = req.body;
    
    const notification = await Notification.create({
      title,
      message,
      type,
      targetUsers: isGlobal ? [] : targetUsers,
      isGlobal: isGlobal || false,
      date: date || new Date(),
      createdBy: req.user._id
    });
    
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my notifications
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { isGlobal: true },
        { targetUsers: req.user._id }
      ]
    }).sort({ date: -1 });
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    const existingRead = notification.isRead.find(
      r => r.userId.toString() === req.user._id.toString()
    );
    
    if (!existingRead) {
      notification.isRead.push({
        userId: req.user._id,
        readAt: new Date()
      });
      await notification.save();
    }
    
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all notifications (Admin)
const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('createdBy', 'name')
      .sort({ date: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
  getAllNotifications,
  deleteNotification
};