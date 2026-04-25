const User = require('../models/User');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');

// Dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalEmployees, presentToday, pendingTasks, completedTasks, totalSalary] = await Promise.all([
      User.countDocuments({ role: 'employee', isActive: true }),
      Attendance.countDocuments({
        date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        status: 'present'
      }),
      Task.countDocuments({ status: { $in: ['pending', 'working'] } }),
      Task.countDocuments({ status: 'completed', updatedAt: { $gte: today } }),
      User.aggregate([
        { $match: { role: 'employee', isActive: true } },
        { $group: { _id: null, total: { $sum: '$salary' } } }
      ])
    ]);
    
    const onLeave = await Attendance.countDocuments({
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      status: 'absent'
    });
    
    res.json({
      totalEmployees,
      presentToday,
      pendingTasks,
      completedTasks,
      onLeave,
      monthlySalary: totalSalary[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update employee (Admin only)
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, salary, position, department, isActive } = req.body;
    
    const employee = await User.findByIdAndUpdate(
      id,
      { name, email, salary, position, department, isActive },
      { new: true }
    ).select('-password');
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get weekly task report
const getWeeklyTaskReport = async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const report = await Task.aggregate([
      { $match: { createdAt: { $gte: oneWeekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          working: { $sum: { $cond: [{ $eq: ['$status', 'working'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
  getWeeklyTaskReport
};