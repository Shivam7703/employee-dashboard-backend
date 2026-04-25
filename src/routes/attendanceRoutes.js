const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  markAttendance
} = require('../controllers/attendanceController');

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/my-attendance', protect, getMyAttendance);
router.get('/', protect, adminOnly, getAllAttendance);
router.post('/mark', protect, adminOnly, markAttendance);

module.exports = router;