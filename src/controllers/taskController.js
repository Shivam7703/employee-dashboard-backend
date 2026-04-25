const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Create task (Admin only)
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, priority, estimatedHours } = req.body;
    
    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      dueDate,
      priority,
      estimatedHours: estimatedHours || 0,
      statusHistory: [{ status: 'pending', timestamp: new Date(), updatedBy: req.user._id }]
    });
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email employeeId')
      .populate('assignedBy', 'name');
    
    // Create notification for employee
    await Notification.create({
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${title}`,
      type: 'task',
      targetUsers: [assignedTo],
      date: new Date(),
      createdBy: req.user._id
    });
    
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tasks for employee
const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all tasks (Admin only)
const getAllTasks = async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority) filter.priority = priority;
    
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email employeeId')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by employee (Admin only)
const getEmployeeTasks = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const tasks = await Task.find({ assignedTo: employeeId })
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check permission
    if (task.assignedTo.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const oldStatus = task.status;
    task.status = status;
    task.statusHistory.push({ 
      status, 
      timestamp: new Date(), 
      note, 
      updatedBy: req.user._id 
    });
    
    if (status === 'completed' && !task.completedDate) {
      task.completedDate = new Date();
    }
    
    await task.save();
    
    const updatedTask = await Task.findById(id)
      .populate('assignedTo', 'name email employeeId')
      .populate('assignedBy', 'name');
    
    // Notify admin if employee updated task
    if (req.user.role === 'employee' && oldStatus !== status) {
      await Notification.create({
        title: 'Task Status Updated',
        message: `${req.user.name} updated task "${task.title}" from ${oldStatus} to ${status}`,
        type: 'task',
        targetUsers: [task.assignedBy],
        date: new Date(),
        createdBy: req.user._id
      });
    }
    
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update task (Admin only)
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, priority, estimatedHours } = req.body;
    
    const task = await Task.findByIdAndUpdate(
      id,
      { title, description, dueDate, priority, estimatedHours },
      { new: true }
    ).populate('assignedTo', 'name email employeeId')
     .populate('assignedBy', 'name');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete task (Admin only)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getMyTasks,
  getAllTasks,
  getEmployeeTasks,
  updateTaskStatus,
  updateTask,
  deleteTask
};