import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoose = (await import('mongoose')).default;
    await mongoose.connect(process.env.MONGODB_URI);

    const email = process.env.ADMIN_EMAIL || 'admin@shop.com';
    const existing = await User.findOne({ email });

    if (existing) {
      console.log('Admin user already exists:', email);
      process.exit(0);
    }

    await User.create({
      name: process.env.ADMIN_NAME || 'Admin User',
      email,
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
    });

    console.log('Admin user created successfully');
    console.log('Email:', email);
    console.log('Password:', process.env.ADMIN_PASSWORD || 'Admin@123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
