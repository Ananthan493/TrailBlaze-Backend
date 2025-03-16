import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import analyzerRoutes from './routes/analyzer.js';
import progressRoutes from './routes/progress.js';
import adminRoutes from './routes/admin.js';
import usersRoutes from './routes/users.js';  // Add this line
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize required directories
const dirs = {
  uploads: path.join(__dirname, 'uploads'),
  certificates: path.join(__dirname, 'uploads', 'certificates'),
  videos: path.join(__dirname, 'uploads', 'videos'),
  profiles: path.join(__dirname, 'uploads', 'profiles'),
  public: path.join(__dirname, 'public')
};

// Create directories if they don't exist
Object.entries(dirs).forEach(([name, dir]) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created ${name} directory:`, dir);
    }
  } catch (error) {
    console.error(`Failed to create ${name} directory:`, error);
    process.exit(1);
  }
});

const app = express();

// Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3003',
  credentials: true
}));

app.use(express.json());

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/models', express.static('public/models'));
app.use('/certificates', express.static('uploads/certificates'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/analyzer', analyzerRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);  // Add this line

// Serve static files with proper headers
app.use('/uploads', (req, res, next) => {
  res.set('Cache-Control', 'no-cache');
  res.set('Content-Security-Policy', "default-src 'self'");
  express.static(dirs.uploads)(req, res, next);
});

// Configure static file serving with proper headers
app.use('/uploads', (req, res, next) => {
  console.log('Static file request:', req.path);
  
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Access-Control-Allow-Origin', '*');
  
  if (req.path.endsWith('.mp4')) {
    res.header('Content-Type', 'video/mp4');
    res.header('Accept-Ranges', 'bytes');
  }
  
  next();
}, express.static(dirs.uploads));

app.use('/uploads/certificates', express.static(dirs.certificates));

// Add health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Update MongoDB connection with better error handling
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
