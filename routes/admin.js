import express from 'express';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Badge from '../models/Badge.js';
import Certificate from '../models/Certificate.js';
import Category from '../models/Category.js';
import CertificateTemplate from '../models/CertificateTemplate.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Update upload directory to store directly in videos folder
const uploadDir = path.join(__dirname, '../uploads/videos');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created videos directory:', uploadDir);
}

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const videosDir = path.join(__dirname, '../uploads/videos');
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }
    cb(null, videosDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(mp4|MP4|mov|MOV|mkv|MKV)$/)) {
      return cb(new Error('Only video files are allowed!'), false);
    }
    cb(null, true);
  }
});

const router = express.Router();

// User Management
router.get('/users', [auth, adminAuth], async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.patch('/users/:id/role', [auth, adminAuth], async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to update user role" });
  }
});

// Course Management
router.get('/courses/pending', [auth, adminAuth], async (req, res) => {
  try {
    const courses = await Course.find({ status: 'pending' })
      .populate('instructor', 'name email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pending courses" });
  }
});

router.get('/courses', [auth, adminAuth], async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'name email')
      .select('title category status createdAt');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

router.patch('/courses/:id/status', [auth, adminAuth], async (req, res) => {
  try {
    const { status } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: "Failed to update course status" });
  }
});

router.put('/courses/:id', [auth, adminAuth], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        lastUpdated: new Date()
      },
      { new: true }
    );

    res.json({
      message: "Course updated successfully",
      course: updatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: "Failed to update course" });
  }
});

router.delete('/courses/:id', [auth, adminAuth], async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete course" });
  }
});

// Course Category Management
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'category',
          as: 'courses'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          courseCount: { $size: '$courses' }
        }
      }
    ]);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

router.post('/categories', [auth, adminAuth], async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Failed to create category" });
  }
});

// Bulk Course Actions
router.post('/courses/bulk', [auth, adminAuth], async (req, res) => {
  try {
    const { action, courseIds } = req.body;
    
    switch (action) {
      case 'publish':
        await Course.updateMany(
          { _id: { $in: courseIds } },
          { status: 'published' }
        );
        break;
      case 'archive':
        await Course.updateMany(
          { _id: { $in: courseIds } },
          { status: 'archived' }
        );
        break;
      case 'delete':
        await Course.deleteMany({ _id: { $in: courseIds } });
        break;
    }
    
    res.json({ message: "Bulk action completed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to perform bulk action" });
  }
});

// Analytics
router.get('/analytics', [auth, adminAuth], async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastActive: { $gte: new Date(Date.now() - 24*60*60*1000) }
    });
    const totalCourses = await Course.countDocuments();
    const completedCourses = await Course.countDocuments({ status: 'completed' });
    
    // Calculate engagement rate
    const engagementRate = Math.round((activeUsers / totalUsers) * 100) || 0;

    res.json({
      userStats: {
        total: totalUsers,
        active: activeUsers
      },
      courseStats: {
        total: totalCourses,
        completed: completedCourses
      },
      engagementRate,
      recentActivities: [] // You can add actual activities here
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

// Gamification Routes
router.post('/badges', [auth, adminAuth], async (req, res) => {
  try {
    const badge = await Badge.create(req.body);
    res.status(201).json(badge);
  } catch (error) {
    res.status(500).json({ message: "Failed to create badge" });
  }
});

// Badge Management Routes
router.get('/badges', [auth, adminAuth], async (req, res) => {
  try {
    const badges = await Badge.find();
    res.json(badges);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch badges" });
  }
});

router.post('/badges', [auth, adminAuth], async (req, res) => {
  try {
    const badge = await Badge.create(req.body);
    res.status(201).json(badge);
  } catch (error) {
    res.status(500).json({ message: "Failed to create badge" });
  }
});

router.delete('/badges/:id', [auth, adminAuth], async (req, res) => {
  try {
    await Badge.findByIdAndDelete(req.params.id);
    res.json({ message: "Badge deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete badge" });
  }
});

// Certificate Management
router.post('/certificates/issue', [auth, adminAuth], async (req, res) => {
  try {
    const { userId, courseId, template } = req.body;
    const certificate = await Certificate.create({
      userId,
      courseId,
      template,
      blockchain: {
        transactionId: `TX${Date.now()}`, // Replace with actual blockchain integration
        verificationUrl: `https://verify.trailblaze.com/${Date.now()}`
      }
    });
    res.status(201).json(certificate);
  } catch (error) {
    res.status(500).json({ message: "Failed to issue certificate" });
  }
});

// Certificate Template Management
router.get('/certificates/templates', [auth, adminAuth], async (req, res) => {
  try {
    const templates = await CertificateTemplate.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: "Failed to fetch certificate templates" });
  }
});

router.post('/certificates/templates', [auth, adminAuth], async (req, res) => {
  try {
    const { name, design, variables } = req.body;
    
    // Basic validation
    if (!name || !design) {
      return res.status(400).json({ message: "Name and design are required" });
    }

    // Check if default template exists when creating a new default
    if (req.body.isDefault) {
      await CertificateTemplate.updateMany(
        { isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const template = await CertificateTemplate.create({
      name,
      design,
      variables: variables || [],
      isDefault: req.body.isDefault || false
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ 
      message: "Failed to create certificate template",
      error: error.message 
    });
  }
});

router.put('/certificates/templates/:id', [auth, adminAuth], async (req, res) => {
  try {
    const template = await CertificateTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(template);
  } catch (error) {
    console.error('Failed to update certificate template:', error);
    res.status(500).json({ message: "Failed to update template" });
  }
});

router.delete('/certificates/templates/:id', [auth, adminAuth], async (req, res) => {
  try {
    await CertificateTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error('Failed to delete certificate template:', error);
    res.status(500).json({ message: "Failed to delete template" });
  }
});

// Quiz Management Routes
router.post('/courses/:courseId/quiz', [auth, adminAuth], async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.content.push({
      type: 'quiz',
      title: req.body.title,
      data: {
        questions: req.body.questions,
        duration: req.body.duration
      }
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: "Failed to add quiz" });
  }
});

// Learning Style Reports
router.get('/reports/learning-styles', [auth, adminAuth], async (req, res) => {
  try {
    const users = await User.find({
      analyzedLearningStyle: { $ne: null }
    }).select('name email learningBehavior analyzedLearningStyle lastStyleAnalysis');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch learning style reports" });
  }
});

// Video upload route
router.post('/upload/video', auth, adminAuth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const filePath = req.file.path;
    console.log('Video upload path:', filePath);

    // Verify file exists and is readable
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.size === 0) {
        await fs.promises.unlink(filePath);
        return res.status(400).json({ message: 'Uploaded file is empty' });
      }
    } catch (error) {
      console.error('File validation error:', error);
      return res.status(400).json({ message: 'File validation failed' });
    }

    const videoUrl = `/uploads/videos/${req.file.filename}`;
    console.log('Video URL:', videoUrl);

    res.json({
      message: 'Video uploaded successfully',
      url: videoUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ message: 'Failed to upload video' });
  }
});

// Add test route for file access
router.get('/test-video/:filename', [auth, adminAuth], (req, res) => {
  const filepath = path.join(__dirname, '../uploads/videos', req.params.filename);
  if (fs.existsSync(filepath)) {
    res.json({ exists: true, path: filepath });
  } else {
    res.json({ exists: false, path: filepath });
  }
});

// Add this new route near the top with other GET routes
router.get('/stats', [auth, adminAuth], async (req, res) => {
  try {
    const stats = {
      users: {
        total: await User.countDocuments(),
        active: await User.countDocuments({ 
          lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),
        new: await User.countDocuments({ 
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
      },
      courses: {
        total: await Course.countDocuments(),
        active: await Course.countDocuments({ status: 'active' }),
        pending: await Course.countDocuments({ status: 'pending' })
      },
      system: {
        status: 'operational',
        uptime: '99.9%',
        errors: 0,
        storage: '75%'
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: "Failed to fetch admin statistics" });
  }
});

export default router;
