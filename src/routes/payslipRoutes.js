const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  generatePayslip,
  getMyPayslips,
  getAllPayslips
} = require('../controllers/payslipController');

router.post('/generate', protect, adminOnly, generatePayslip);
router.get('/my-payslips', protect, getMyPayslips);
router.get('/', protect, adminOnly, getAllPayslips);

module.exports = router;