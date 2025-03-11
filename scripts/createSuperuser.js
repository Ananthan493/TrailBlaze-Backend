import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createSuperuser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const password = await bcrypt.hash('admin123', 12);
    const superuser = await User.create({
      name: 'Admin',
      email: 'admin@trailblaze.com',
      password,
      role: 'admin',
      learningStyle: 'visual'
    });

    console.log('Superuser created successfully:', superuser.email);
    process.exit(0);
  } catch (error) {
    console.error('Error creating superuser:', error);
    process.exit(1);
  }
};

createSuperuser();
