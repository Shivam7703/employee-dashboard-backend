const mongoose = require('mongoose');

const taskStatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'working', 'completed']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  note: String
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'working', 'completed'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  statusHistory: [taskStatusHistorySchema]
}, {
  timestamps: true
});

// Index for auto-deletion after 1 week of completion
taskSchema.index({ updatedAt: 1 }, { 
  partialFilterExpression: { status: 'completed' },
  expireAfterSeconds: 604800 // 7 days
});

module.exports = mongoose.model('Task', taskSchema);