const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['holiday', 'meeting', 'announcement', 'reminder', 'task', 'attendance'],
    required: true
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isGlobal: {
    type: Boolean,
    default: true
  },
  date: {
    type: Date,
    required: true
  },
  isRead: [{
    userId: mongoose.Schema.Types.ObjectId,
    readAt: Date
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);