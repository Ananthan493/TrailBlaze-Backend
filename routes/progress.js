import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/:courseId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const progress = user.progress.find(p => p.courseId.toString() === req.params.courseId);
    res.json(progress || { completion: 0 });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch progress" });
  }
});

router.post('/:courseId', auth, async (req, res) => {
  try {
    const { completion } = req.body;
    const user = await User.findById(req.userId);
    const progressIndex = user.progress.findIndex(p => 
      p.courseId.toString() === req.params.courseId
    );

    if (progressIndex > -1) {
      user.progress[progressIndex].completion = completion;
      user.progress[progressIndex].lastAccessed = new Date();
    } else {
      user.progress.push({
        courseId: req.params.courseId,
        completion,
        lastAccessed: new Date()
      });
    }

    await user.save();
    res.json(user.progress);
  } catch (error) {
    res.status(500).json({ message: "Failed to update progress" });
  }
});

router.post('/:courseId/activity', auth, async (req, res) => {
  try {
    const { activityType, score, contentType } = req.body;
    const user = await User.findById(req.userId);

    // Update learning behavior based on activity
    const behaviorUpdate = {};
    switch (contentType) {
      case 'video':
        behaviorUpdate.visualScore = user.learningBehavior.visualScore + score;
        break;
      case 'audio':
        behaviorUpdate.auditoryScore = user.learningBehavior.auditoryScore + score;
        break;
      case 'interactive':
        behaviorUpdate.kinestheticScore = user.learningBehavior.kinestheticScore + score;
        break;
      case 'text':
        behaviorUpdate.readingScore = user.learningBehavior.readingScore + score;
        break;
    }

    await User.findByIdAndUpdate(req.userId, {
      $inc: {
        'learningBehavior.totalActivities': 1,
        [`learningBehavior.${Object.keys(behaviorUpdate)[0]}`]: Object.values(behaviorUpdate)[0]
      }
    });

    // Analyze learning style after every 10 activities
    if (user.learningBehavior.totalActivities % 10 === 0) {
      user.calculateLearningStyle();
      await user.save();

      // Send report to admin
      await sendLearningStyleReport(user);
    }

    res.json({ message: 'Progress updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update progress' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('progress.courseId', 'title');
    
    const progressData = user.progress.map(p => ({
      courseId: p.courseId._id,
      courseTitle: p.courseId.title,
      completion: p.completion,
      lastAccessed: p.lastAccessed
    }));

    res.json(progressData);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch progress data" });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('progress.courseId');
    
    const totalCourses = user.progress.length;
    const completedCourses = user.progress.filter(p => p.completion === 100).length;
    const averageProgress = user.progress.reduce((acc, curr) => 
      acc + curr.completion, 0) / (totalCourses || 1);

    const weeklyStats = calculateWeeklyStats(user.progress);
    const milestoneAchievements = calculateMilestones(user.progress);
    const recentActivities = getRecentActivities(user.progress);

    res.json({
      totalCourses,
      completedCourses,
      averageProgress: Math.round(averageProgress),
      learningStyle: user.learningStyle,
      recentActivities,
      weeklyProgress: weeklyStats.progress,
      weeklyActivity: weeklyStats.activity,
      achievements: milestoneAchievements
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

function calculateWeeklyProgress(progress) {
  const now = new Date();
  const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
  
  return progress
    .filter(p => new Date(p.lastAccessed) >= oneWeekAgo)
    .reduce((acc, curr) => acc + curr.completion, 0) / progress.length || 0;
}

async function sendLearningStyleReport(user) {
  try {
    await axios.post(
      `${process.env.REACT_APP_API_URL}/admin/reports/learning-style`,
      {
        userId: user._id,
        name: user.name,
        learningBehavior: user.learningBehavior,
        analyzedStyle: user.analyzedLearningStyle,
        date: new Date()
      }
    );
  } catch (error) {
    console.error('Failed to send learning style report:', error);
  }
}

export default router;
