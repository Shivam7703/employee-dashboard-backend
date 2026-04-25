const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateTokens = async (userId, role, deviceInfo = null) => {
  const accessToken = jwt.sign(
    { userId, role, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, role, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  const decoded = jwt.decode(refreshToken);
  
  // Store refresh token
  await RefreshToken.create({
    token: refreshToken,
    userId,
    expiresAt: new Date(decoded.exp * 1000),
    deviceInfo
  });
  
  return { accessToken, refreshToken };
};

const registerEmployee = async (req, res) => {
  try {
    const { name, email, password, salary, position, department } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const employeeId = `EMP${Date.now()}`;
    
    const user = await User.create({
      name,
      email,
      password,
      role: 'employee',
      employeeId,
      salary,
      position,
      department
    });
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      salary: user.salary,
      position: user.position,
      department: user.department
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    };
    
    const { accessToken, refreshToken } = await generateTokens(user._id, user.role, deviceInfo);
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      salary: user.salary,
      position: user.position,
      department: user.department,
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }
    
    const storedToken = await RefreshToken.findOne({ token: refreshToken, isRevoked: false });
    if (!storedToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }
    
    if (storedToken.expiresAt < new Date()) {
      return res.status(403).json({ message: 'Refresh token expired' });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Revoke old token
    storedToken.isRevoked = true;
    await storedToken.save();
    
    // Generate new tokens
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    };
    const tokens = await generateTokens(user._id, user.role, deviceInfo);
    
    res.json(tokens);
  } catch (error) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken },
        { isRevoked: true, revokedAt: new Date(), revokedReason: 'logout' }
      );
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phoneNumber, address },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerEmployee,
  login,
  refreshToken,
  logout,
  changePassword,
  updateProfile,
  getProfile
};