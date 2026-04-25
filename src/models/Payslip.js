const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  totalDays: Number,
  presentDays: Number,
  absentDays: Number,
  lateDays: Number,
  halfDays: Number,
  basicSalary: Number,
  allowances: {
    hra: Number,
    da: Number,
    ta: Number,
    other: Number
  },
  deductions: {
    pf: Number,
    tax: Number,
    insurance: Number,
    other: Number
  },
  bonuses: Number,
  netSalary: Number,
  pdfUrl: String,
  generatedDate: {
    type: Date,
    default: Date.now
  },
  isDownloaded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

payslipSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payslip', payslipSchema);