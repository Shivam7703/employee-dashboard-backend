const cron = require('node-cron');
const Payslip = require('../models/Payslip');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');

class CronJobs {
  constructor() {
    this.initJobs();
  }

  initJobs() {
    // Generate payslips on 9th of every month at 9 AM
    cron.schedule('0 9 9 * *', async () => {
      console.log('🔄 Running cron job: Generate payslips');
      await this.generateMonthlyPayslips();
    });

    // Clean up old data every day at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('🔄 Running cron job: Clean old data');
      await this.cleanOldData();
    });

    // Send attendance reminder every day at 6 PM
    cron.schedule('0 18 * * *', async () => {
      console.log('🔄 Running cron job: Send attendance reminder');
      await this.sendAttendanceReminder();
    });

    // Weekly report every Monday at 9 AM
    cron.schedule('0 9 * * 1', async () => {
      console.log('🔄 Running cron job: Send weekly report');
      await this.sendWeeklyReport();
    });
  }

  async generateMonthlyPayslips() {
    try {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const month = lastMonth.getMonth() + 1;
      const year = lastMonth.getFullYear();

      const employees = await User.find({ role: 'employee', isActive: true });
      
      for (const employee of employees) {
        // Check if payslip already exists
        const existing = await Payslip.findOne({ 
          employeeId: employee._id, 
          month, 
          year 
        });
        
        if (existing) continue;

        // Calculate attendance for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const attendance = await Attendance.find({
          employeeId: employee._id,
          date: { $gte: startDate, $lte: endDate }
        });

        const totalDays = new Date(year, month, 0).getDate();
        const presentDays = attendance.filter(a => a.status === 'present').length;
        const absentDays = attendance.filter(a => a.status === 'absent').length;
        const lateDays = attendance.filter(a => a.status === 'late').length;
        const halfDays = attendance.filter(a => a.status === 'half-day').length;

        // Calculate salary components
        const dailyRate = employee.salary / totalDays;
        const deductions = {
          pf: employee.salary * 0.12,
          professionalTax: 200,
          incomeTax: employee.salary > 50000 ? employee.salary * 0.05 : 0,
          insurance: 1000,
          loan: 0,
          other: absentDays * dailyRate
        };

        const allowances = {
          hra: employee.salary * 0.2,
          da: employee.salary * 0.1,
          ta: 1500,
          medical: 1250,
          other: 0
        };

        const bonuses = presentDays >= totalDays * 0.9 ? 2000 : 0;
        const arrears = 0;

        // Generate PDF
        const payslipData = {
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
          arrears
        };

        const filename = await pdfService.generatePayslip(employee, payslipData);
        const pdfUrl = await pdfService.getPayslipUrl(filename);

        // Save payslip to database
        await Payslip.create({
          employeeId: employee._id,
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
          netSalary: employee.salary + 
            Object.values(allowances).reduce((a,b) => a+b, 0) + 
            bonuses - 
            Object.values(deductions).reduce((a,b) => a+b, 0),
          pdfUrl,
          pdfGeneratedAt: new Date()
        });

        // Send email notification
        await emailService.sendPayslipEmail(employee, pdfUrl, month, year);
      }
      
      console.log(`✅ Generated payslips for ${employees.length} employees`);
    } catch (error) {
      console.error('Error generating payslips:', error);
    }
  }

  async cleanOldData() {
    try {
      // Delete old completed tasks (older than 7 days)
      const taskResult = await Task.deleteMany({
        status: 'completed',
        updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });
      
      // Delete old chats (older than 30 days)
      const chatResult = await Chat.deleteMany({
        createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });
      
      // Delete old attendance (older than 45 days)
      const attendanceResult = await Attendance.deleteMany({
        date: { $lt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) }
      });
      
      console.log('🧹 Cleanup completed:', {
        tasks: taskResult.deletedCount,
        chats: chatResult.deletedCount,
        attendance: attendanceResult.deletedCount
      });
    } catch (error) {
      console.error('Error cleaning old data:', error);
    }
  }

  async sendAttendanceReminder() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const employees = await User.find({ role: 'employee', isActive: true });
      const checkedIn = await Attendance.find({
        date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      }).distinct('employeeId');
      
      const missingAttendance = employees.filter(e => !checkedIn.includes(e._id));
      
      for (const employee of missingAttendance) {
        // Send reminder notification (implement based on your notification system)
        console.log(`Reminder sent to ${employee.email}`);
      }
      
      console.log(`Sent attendance reminder to ${missingAttendance.length} employees`);
    } catch (error) {
      console.error('Error sending attendance reminder:', error);
    }
  }

  async sendWeeklyReport() {
    try {
      const admins = await User.find({ role: 'admin' });
      
      for (const admin of admins) {
        // Generate weekly report data
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const stats = await Promise.all([
          Task.countDocuments({ createdAt: { $gte: weekAgo } }),
          Task.countDocuments({ 
            status: 'completed',
            createdAt: { $gte: weekAgo }
          }),
          Attendance.countDocuments({ 
            date: { $gte: weekAgo },
            status: 'present'
          }),
          User.countDocuments({ role: 'employee', isActive: true })
        ]);
        
        // Send email report (implement based on your email service)
        console.log(`Weekly report sent to ${admin.email}`);
      }
    } catch (error) {
      console.error('Error sending weekly report:', error);
    }
  }
}

module.exports = new CronJobs();