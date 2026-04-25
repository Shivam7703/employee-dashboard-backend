const Payslip = require('../models/Payslip');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// Generate payslip (Admin only)
const generatePayslip = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;
    
    // Check if payslip already exists
    let payslip = await Payslip.findOne({ employeeId, month, year });
    if (payslip) {
      return res.json(payslip);
    }
    
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Calculate attendance for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const attendanceRecords = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    });
    
    const totalDays = new Date(year, month, 0).getDate();
    const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
    const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
    const lateDays = attendanceRecords.filter(a => a.status === 'late').length;
    const halfDays = attendanceRecords.filter(a => a.status === 'half-day').length;
    
    // Calculate salary components
    const dailyRate = employee.salary / totalDays;
    const allowances = {
      hra: employee.salary * 0.2,
      da: employee.salary * 0.1,
      ta: 1500,
      medical: 1250,
      special: 0,
      other: 0
    };
    
    const deductions = {
      pf: employee.salary * 0.12,
      professionalTax: 200,
      incomeTax: employee.salary > 50000 ? employee.salary * 0.05 : 0,
      insurance: 1000,
      loan: 0,
      other: Math.max(0, absentDays * dailyRate)
    };
    
    const bonuses = presentDays >= totalDays * 0.9 ? 2000 : 0;
    const arrears = 0;
    
    const totalAllowances = Object.values(allowances).reduce((a, b) => a + b, 0);
    const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
    const grossSalary = employee.salary + totalAllowances + bonuses + arrears;
    const netSalary = grossSalary - totalDeductions;
    
    // Create payslip record (PDF generation will be added later)
    payslip = await Payslip.create({
      employeeId,
      month,
      year,
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      halfDays,
      basicSalary: employee.salary,
      allowances,
      deductions,
      bonuses,
      arrears,
      grossSalary,
      netSalary,
      pdfUrl: `/payslips/${employee.employeeId}_${month}_${year}.pdf`,
      generatedBy: req.user._id
    });
    
    const populatedPayslip = await Payslip.findById(payslip._id)
      .populate('employeeId', 'name email employeeId position department');
    
    res.status(201).json(populatedPayslip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my payslips (Employee)
const getMyPayslips = async (req, res) => {
  try {
    const payslips = await Payslip.find({ employeeId: req.user._id })
      .sort({ year: -1, month: -1 });
    res.json(payslips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all payslips (Admin)
const getAllPayslips = async (req, res) => {
  try {
    const payslips = await Payslip.find()
      .populate('employeeId', 'name email employeeId position department salary')
      .sort({ year: -1, month: -1 });
    res.json(payslips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generatePayslip,
  getMyPayslips,
  getAllPayslips
};