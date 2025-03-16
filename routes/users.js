import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Profile update route
router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.file) {
      updateData.profilePicture = `/uploads/profiles/${req.file.filename}`;
      
      // Remove old profile picture if exists
      const user = await User.findById(req.userId);
      if (user.profilePicture) {
        const oldPicturePath = path.join(__dirname, '..', user.profilePicture);
        if (fs.existsSync(oldPicturePath)) {
          fs.unlinkSync(oldPicturePath);
        }
      }
    }

    if (updateData.socialLinks) {
      updateData.socialLinks = JSON.parse(updateData.socialLinks);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('progress.courseId', 'title duration');

    // Calculate learning style percentages based on user behavior
    const totalEngagements = user.learningBehavior?.totalEngagement || 1;
    const learningStyles = {
      visual: {
        percentage: (user.learningBehavior?.visualEngagement / totalEngagements) * 100 || 25,
        level: 'Growing',
        description: 'You learn best through visual aids and demonstrations'
      },
      auditory: {
        percentage: (user.learningBehavior?.auditoryEngagement / totalEngagements) * 100 || 25,
        level: 'Growing',
        description: 'You absorb information through listening and discussion'
      },
      kinesthetic: {
        percentage: (user.learningBehavior?.kinestheticEngagement / totalEngagements) * 100 || 25,
        level: 'Growing',
        description: 'You learn by doing and hands-on experience'
      },
      reading: {
        percentage: (user.learningBehavior?.readingEngagement / totalEngagements) * 100 || 25,
        level: 'Growing',
        description: 'You prefer learning through written materials'
      }
    };

    // Update levels based on percentages
    Object.values(learningStyles).forEach(style => {
      if (style.percentage >= 75) style.level = 'Expert';
      else if (style.percentage >= 50) style.level = 'Proficient';
      else style.level = 'Growing';
    });

    // Add learning styles to user object
    user.learningBehavior = {
      ...user.learningBehavior,
      styles: learningStyles
    };

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate additional stats
    const stats = {
      totalCourses: user.progress.length,
      completedCourses: user.progress.filter(p => p.completion === 100).length,
      averageProgress: user.progress.reduce((acc, p) => acc + p.completion, 0) / user.progress.length || 0,
      learningStyle: user.analyzedLearningStyle || 'Visual',
      achievements: [
        { icon: '🎯', title: 'Fast Learner', description: 'Completed 3 courses' },
        { icon: '🏆', title: 'Quiz Master', description: 'Perfect quiz score' },
        { icon: '⭐', title: 'Star Student', description: '90% average progress' }
      ],
      recentActivities: user.progress
        .sort((a, b) => b.lastAccessed - a.lastAccessed)
        .slice(0, 5)
        .map(p => ({
          courseId: p.courseId._id,
          courseTitle: p.courseId.title,
          completion: p.completion,
          lastAccessed: p.lastAccessed
        }))
    };

    res.json({
      user,
      stats
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

export default router;
