// Create a seed file: backend/src/seeds/adminSeeder.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdmin = async () => {
  const User = require('../models/User');
  await mongoose.connect(process.env.MONGODB_URI);
  
  const adminExists = await User.findOne({ email: 'admin@example.com' });
  if (!adminExists) {
    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });
    console.log('✅ Admin user created');
  }
  
  await mongoose.disconnect();
};

createAdmin();