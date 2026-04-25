const Joi = require('joi');

// User validation schemas
const userValidation = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    salary: Joi.number().min(0),
    position: Joi.string(),
    department: Joi.string().valid('IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    phoneNumber: Joi.string().pattern(/^[0-9]{10}$/),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      pincode: Joi.string().pattern(/^[0-9]{6}$/)
    })
  })
};

// Task validation schemas
const taskValidation = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    assignedTo: Joi.string().required(),
    dueDate: Joi.date().greater('now').required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
    estimatedHours: Joi.number().min(0).max(100)
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'working', 'completed', 'cancelled').required(),
    note: Joi.string().max(500)
  })
};

// Attendance validation schemas
const attendanceValidation = {
  markAttendance: Joi.object({
    employeeId: Joi.string().required(),
    date: Joi.date().required(),
    status: Joi.string().valid('present', 'absent', 'late', 'half-day').required(),
    checkInTime: Joi.date(),
    checkOutTime: Joi.date(),
    remarks: Joi.string().max(500)
  }),

  checkIn: Joi.object({
    location: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180),
      address: Joi.string()
    })
  })
};

// Chat validation schemas
const chatValidation = {
  sendMessage: Joi.object({
    receiverId: Joi.string().required(),
    message: Joi.string().min(1).max(1000).required(),
    messageType: Joi.string().valid('text', 'image', 'file')
  })
};

// Payslip validation schemas
const payslipValidation = {
  generate: Joi.object({
    employeeId: Joi.string().required(),
    month: Joi.number().min(1).max(12).required(),
    year: Joi.number().min(2020).max(2030).required()
  })
};

// Notification validation
const notificationValidation = {
  create: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    message: Joi.string().min(5).max(500).required(),
    type: Joi.string().valid('holiday', 'meeting', 'announcement', 'reminder', 'task').required(),
    date: Joi.date().required(),
    isGlobal: Joi.boolean(),
    targetUsers: Joi.array().items(Joi.string())
  })
};

module.exports = {
  userValidation,
  taskValidation,
  attendanceValidation,
  chatValidation,
  payslipValidation,
  notificationValidation
};