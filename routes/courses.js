import express from 'express';
import auth from '../middleware/auth.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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
    
    const videosDir = path.join(__dirname, '../uploads/videos');
    console.log('Videos directory:', videosDir);

    // Ensure videos directory exists
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }

    const course = await Course.findById(req.params.courseId)
      .populate('instructor', 'name email')
      .select('-__v');
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Debug the raw content before transformation
    console.log('Raw course content:', course.content);

    // Transform and validate video content
    if (course.content) {
      course.content = course.content.map(item => {
        // Ensure item is properly structured
        if (!item || typeof item !== 'object') {
          console.error('Invalid content item:', item);
          return null;
        }

        if (item.type === 'video') {
          console.log('Processing video item:', {
            title: item.title,
            originalData: item.data
          });

          // Handle missing or invalid data
          if (!item.data) {
            return {
              ...item,
              status: 'error',
              message: 'Video data is missing',
              data: null
            };
          }

          const filename = path.basename(item.data);
          const videoPath = path.join(videosDir, filename);
          
          console.log('Checking video file:', {
            filename,
            path: videoPath,
            exists: fs.existsSync(videoPath)
          });

          if (fs.existsSync(videoPath)) {
            const stats = fs.statSync(videoPath);
            if (stats.size > 0) {
              return {
                ...item,
                data: `/uploads/videos/${filename}`,
                status: 'ready',
                size: stats.size
              };
            }
          }

          return {
            ...item,
            data: null,
            status: 'error',
            message: 'Video file not found or empty'
          };
        }

        return item;
      }).filter(Boolean); // Remove any null items
    }

    // Log the final processed content
    console.log('Processed course content:', course.content.map(c => ({
      type: c.type,
      title: c.title,
      status: c.status,
      hasData: !!c.data,
      dataPath: c.data
    })));

    res.json(course);
  } catch (error) {
    console.error('Course detail error:', {
      error: error.message,
      stack: error.stack,
      courseId: req.params.courseId
    });
    res.status(500).json({ 
      message: "Failed to fetch course details",
      error: error.message
    });
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
    const user = await User.findById(req.userId);
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const isEnrolled = user.progress.some(p => 
      p.courseId.toString() === req.params.courseId
    );

    if (isEnrolled) {
      return res.status(400).json({ message: "Already enrolled" });
    }

    user.progress.push({
      courseId: req.params.courseId,
      completion: 0,
      lastAccessed: new Date()
    });

    await user.save();
    res.json({ message: "Successfully enrolled" });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: "Failed to enroll" });
  }
});

// Update course progress
router.post('/:courseId/progress', auth, async (req, res) => {
  try {
    const { completion } = req.body;
    const user = await User.findById(req.userId);
    const progressIndex = user.progress.findIndex(
      p => p.courseId.toString() === req.params.courseId
    );

    if (progressIndex === -1) {
      return res.status(400).json({ message: "Not enrolled in this course" });
    }

    user.progress[progressIndex].completion = completion;
    user.progress[progressIndex].lastAccessed = new Date();

    await user.save();
    res.json({ message: "Progress updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update progress" });
  }
});

// Get course certificate
router.get('/:courseId/certificate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const progress = user.progress.find(
      p => p.courseId.toString() === req.params.courseId
    );

    if (!progress || progress.completion < 100) {
      return res.status(400).json({ 
        message: "Certificate not available. Complete the course first." 
      });
    }

    // Generate certificate logic here
    // For now, sending a placeholder response
    res.json({ 
      certificateUrl: `certificate-${req.params.courseId}.pdf`,
      issueDate: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate certificate" });
  }
});

function getDifficultyLevel(progress) {
  const completedCount = progress.filter(p => p.completion === 100).length;
  if (completedCount < 2) return 'beginner';
  if (completedCount < 5) return 'intermediate';
  return 'advanced';
}

export default router;
