import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/analyze', auth, async (req, res) => {
  try {
    const { answers } = req.body;
    // Simple algorithm to determine learning style based on answers
    const styles = {
      visual: 0,
      auditory: 0,
      kinesthetic: 0,
      reading: 0
    };
    
    answers.forEach(answer => {
      styles[answer.preference]++;
    });

    const learningStyle = Object.entries(styles)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    await User.findByIdAndUpdate(req.userId, { learningStyle });
    res.json({ learningStyle });
  } catch (error) {
    res.status(500).json({ message: "Analysis failed" });
  }
});

export default router;
