import express from 'express';
import auth from '../middleware/auth.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import generateCertificate from '../utils/certificateGenerator.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, category, difficulty } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    const courses = await Course.find(query)
      .populate('instructor', 'name')
      .select('title description category difficulty learningStyles content');
      
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const course = await Course.create({ ...req.body, instructor: req.userId });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: "Failed to create course" });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: "Failed to update course" });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete course" });
  }
});

router.get('/recommendations', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Default to 'visual' if no learning style is set
    const learningStyle = user.learningStyle || 'visual';

    // Get courses that match the user's learning style
    const courses = await Course.find({
      learningStyles: learningStyle,
      _id: { 
        $nin: user.progress?.map(p => p.courseId) || [] 
      }
    })
    .limit(5)
    .select('title description difficulty learningStyles');

    res.json(courses);
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ 
      message: "Failed to fetch recommendations",
      error: error.message 
    });
  }
});

// Get course details
router.get('/:courseId', auth, async (req, res) => {
  try {
    console.log('Fetching course details for ID:', req.params.courseId);
    
    // Ensure models directory exists
    const modelsDir = path.join(__dirname, '../uploads/models');
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    const course = await Course.findById(req.params.courseId)
      .populate('instructor', 'name email')
      .select('-__v');
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Transform and validate content
    if (course.content) {
      course.content = course.content.map(item => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        if (item.type === 'ar') {
          const modelFileName = item.arModel || 'basic-cube.glb';
          const modelPath = `/uploads/models/${modelFileName}`;
          const fullPath = path.join(__dirname, '..', modelPath);
          const defaultModelPath = path.join(__dirname, '..', 'public', 'models', 'basic-cube.glb');

          // If model doesn't exist, copy default model
          if (!fs.existsSync(fullPath) && fs.existsSync(defaultModelPath)) {
            fs.copyFileSync(defaultModelPath, fullPath);
          }

          return {
            ...item,
            data: modelPath,
            status: fs.existsSync(fullPath) ? 'ready' : 'pending',
            message: fs.existsSync(fullPath) ? undefined : 'AR model is being prepared...'
          };
        }

        return item;
      }).filter(Boolean);
    }

    // Log the processed content
    console.log('Processed course content:', course.content.map(c => ({
      type: c.type,
      title: c.title,
      status: c.status,
      hasData: Boolean(c.data),
      path: c.data
    })));

    res.json(course);
  } catch (error) {
    console.error('Course detail error:', error);
    res.status(500).json({ message: "Failed to fetch course details" });
  }
});

// Check enrollment status
router.get('/:courseId/enrollment', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const courseProgress = user.progress.find(
      p => p.courseId.toString() === req.params.courseId
    );

    res.json({
      enrolled: !!courseProgress,
      progress: courseProgress?.completion || 0,
      quizCompleted: courseProgress?.quizCompleted || false,
      certificateAvailable: courseProgress?.completion === 100
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to check enrollment status" });
  }
});

// Enroll in course
router.post('/:courseId/enroll', auth, async (req, res) => {
  try {
    const courseId = req.params.courseId?.trim();
    console.log('Starting enrollment process:', { courseId, userId: req.userId });

    // Basic validation
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      console.error('Invalid course ID:', courseId);
      return res.status(400).json({ 
        message: "Invalid course ID",
        code: "INVALID_ID"
      });
    }

    // Find user with error handling
    let user;
    try {
      user = await User.findById(req.userId);
      if (!user) {
        console.error('User not found:', req.userId);
        return res.status(404).json({ 
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
      }

      // Ensure user has a learning style
      if (!user.analyzedLearningStyle) {
        user.analyzedLearningStyle = 'visual'; // Set default if missing
      }

    } catch (userError) {
      console.error('Error finding user:', userError);
      return res.status(500).json({ 
        message: "Database error while finding user",
        error: userError.message
      });
    }

    // Find course with error handling
    let course;
    try {
      course = await Course.findById(courseId);
      if (!course) {
        console.error('Course not found:', courseId);
        return res.status(404).json({ 
          message: "Course not found",
          code: "COURSE_NOT_FOUND"
        });
      }
    } catch (courseError) {
      console.error('Error finding course:', courseError);
      return res.status(500).json({ 
        message: "Database error while finding course",
        error: courseError.message
      });
    }

    // Initialize progress array if needed
    if (!Array.isArray(user.progress)) {
      user.progress = [];
    }

    // Check for existing enrollment
    const existingEnrollment = user.progress.find(
      p => p.courseId?.toString() === courseId
    );

    if (existingEnrollment) {
      console.log('User already enrolled:', { userId: req.userId, courseId });
      return res.status(200).json({ 
        message: "Already enrolled in this course",
        enrollment: existingEnrollment,
        code: "ALREADY_ENROLLED"
      });
    }

    // Create new progress entry
    const newProgress = {
      courseId,
      completion: 0,
      contentProgress: new Map(),
      lastAccessed: new Date(),
      enrollmentDate: new Date()
    };

    // Add to user's progress
    user.progress.push(newProgress);

    // Save with error handling
    try {
      await user.save();
      console.log('Enrollment successful:', { userId: req.userId, courseId, learningStyle: user.analyzedLearningStyle });
      
      res.status(201).json({
        message: "Successfully enrolled",
        enrollment: newProgress,
        code: "ENROLLMENT_SUCCESS"
      });
    } catch (saveError) {
      console.error('Error saving enrollment:', saveError);
      return res.status(500).json({ 
        message: "Failed to save enrollment data",
        error: saveError.message
      });
    }

  } catch (error) {
    console.error('Enrollment error:', {
      error: error.message,
      stack: error.stack,
      courseId: req.params.courseId,
      userId: req.userId
    });

    res.status(500).json({
      message: "Failed to process enrollment",
      error: error.message,
      code: "ENROLLMENT_ERROR"
    });
  }
});

// Update course progress
router.post('/:courseId/progress', auth, async (req, res) => {
  try {
    const { completion, contentProgress } = req.body;
    const user = await User.findById(req.userId);
    const course = await Course.findById(req.params.courseId);

    if (!user || !course) {
      return res.status(404).json({ message: "User or course not found" });
    }

    // Update progress
    await User.findOneAndUpdate(
      { _id: req.userId, 'progress.courseId': req.params.courseId },
      {
        $set: {
          'progress.$.completion': completion,
          'progress.$.contentProgress': contentProgress,
          'progress.$.lastAccessed': new Date()
        }
      }
    );

    // Generate certificate if course is completed
    if (completion === 100) {
      try {
        console.log('Generating certificate for:', {
          user: user.name,
          course: course.title
        });

        const certificatePath = await generateCertificate(
          user.name,
          course.title,
          new Date().toLocaleDateString()
        );

        // Save certificate reference
        await User.findOneAndUpdate(
          { _id: req.userId, 'progress.courseId': req.params.courseId },
          {
            $set: {
              'progress.$.certificatePath': certificatePath,
              'progress.$.completionDate': new Date()
            }
          }
        );

        return res.json({
          message: "Progress updated and certificate generated",
          completion,
          certificatePath
        });
      } catch (certError) {
        console.error('Certificate generation error:', certError);
        // Still return success but with a note about certificate failure
        return res.json({
          message: "Progress updated but certificate generation failed",
          completion,
          certificateError: certError.message
        });
      }
    }

    res.json({
      message: "Progress updated successfully",
      completion
    });
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ message: "Failed to update progress" });
  }
});

// Get course certificate
router.get('/:courseId/certificate', auth, async (req, res) => {
  try {
    const certificatesDir = path.join(__dirname, '../uploads/certificates');
    fs.mkdirSync(certificatesDir, { recursive: true });

    const user = await User.findById(req.userId);
    const course = await Course.findById(req.params.courseId);
    
    if (!course || !user) {
      return res.status(404).json({ message: "Course or user not found" });
    }

    // Check if user has completed the course
    const userProgress = user.progress.find(p => 
      p.courseId.toString() === req.params.courseId
    );

    if (!userProgress || userProgress.completion !== 100) {
      return res.status(403).json({ message: "Course not completed" });
    }

    console.log('Generating certificate for:', {
      user: user.name,
      course: course.title,
      date: new Date().toLocaleDateString()
    });

    const certificatePath = await generateCertificate(
      user.name,
      course.title,
      new Date().toLocaleDateString()
    );

    const absolutePath = path.join(__dirname, '..', certificatePath);
    
    if (!fs.existsSync(absolutePath)) {
      throw new Error('Certificate file not found after generation');
    }

    const filename = `certificate-${course.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': fs.statSync(absolutePath).size,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(absolutePath);
    
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error streaming certificate" });
      }
    });

    stream.pipe(res);
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ message: "Failed to generate certificate" });
  }
});

// Add route to view certificate
router.get('/certificates/:filename', auth, (req, res) => {
  try {
    const certificatePath = path.join(__dirname, '../uploads/certificates', req.params.filename);
    
    if (!fs.existsSync(certificatePath)) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    
    const fileStream = fs.createReadStream(certificatePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Certificate view error:', error);
    res.status(500).json({ message: "Failed to view certificate" });
  }
});

function getDifficultyLevel(progress) {
  const completedCount = progress.filter(p => p.completion === 100).length;
  if (completedCount < 2) return 'beginner';
  if (completedCount < 5) return 'intermediate';
  return 'advanced';
}

export default router;
