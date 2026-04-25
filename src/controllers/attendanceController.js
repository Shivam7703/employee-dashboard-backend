const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Check-in
const checkIn = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      employeeId: req.user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });
    
    if (existingAttendance) {
      return res.status(400).json({ message: 'Already checked in today' });
    }
    
    const attendance = await Attendance.create({
      employeeId: req.user._id,
      date: new Date(),
      checkInTime: new Date(),
      status: 'present',
      location: req.body.location,
      ipAddress: req.ip,
      checkInMethod: req.body.method || 'web'
    });
    
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check-out
const checkOut = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      employeeId: req.user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });
    
    if (!attendance) {
      return res.status(404).json({ message: 'No check-in found for today' });
    }
    
    if (attendance.checkOutTime) {
      return res.status(400).json({ message: 'Already checked out' });
    }
    
    attendance.checkOutTime = new Date();
    const hoursDiff = (attendance.checkOutTime - attendance.checkInTime) / (1000 * 60 * 60);
    attendance.workingHours = Math.max(0, Math.round((hoursDiff - 1) * 10) / 10); // Subtract 1 hour lunch
    attendance.overtime = Math.max(0, Math.round((attendance.workingHours - 9) * 10) / 10);
    
    await attendance.save();
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my attendance
const getMyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const attendance = await Attendance.find({
      employeeId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all attendance (Admin only)
const getAllAttendance = async (req, res) => {
  try {
    const { date, employeeId } = req.query;
    const filter = {};
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    
    if (employeeId) filter.employeeId = employeeId;
    
    const attendance = await Attendance.find(filter)
      .populate('employeeId', 'name email employeeId department')
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark attendance (Admin only)
const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkInTime, checkOutTime, remarks } = req.body;
    
    const attendance = await Attendance.findOneAndUpdate(
      { employeeId, date: new Date(date) },
      { 
        status, 
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        remarks,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        isApproved: true
      },
      { upsert: true, new: true }
    );
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  markAttendance
};