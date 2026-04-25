const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    default: 'present'
  },
  checkInTime: Date,
  checkOutTime: Date,
  workingHours: {
    type: Number,
    default: 0
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  notes: String
}, {
  timestamps: true
});

// Compound index for unique daily attendance
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// TTL index for 45 days retention
attendanceSchema.index({ date: 1 }, { 
  expireAfterSeconds: 3888000 // 45 days
});

module.exports = mongoose.model('Attendance', attendanceSchema);