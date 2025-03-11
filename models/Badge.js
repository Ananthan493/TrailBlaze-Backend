import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  criteria: {
    type: { type: String, enum: ['course_completion', 'assessment_score', 'activity'] },
    value: Number,
    timeframe: Number // in days, optional
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Badge', badgeSchema);
