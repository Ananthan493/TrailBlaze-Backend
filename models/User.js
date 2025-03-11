import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  learningStyle: {
    type: String,
    enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
    default: 'visual'
  },
  learningBehavior: {
    visualScore: { type: Number, default: 0 },
    auditoryScore: { type: Number, default: 0 },
    kinestheticScore: { type: Number, default: 0 },
    readingScore: { type: Number, default: 0 },
    totalActivities: { type: Number, default: 0 }
  },
  analyzedLearningStyle: {
    type: String,
    enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
    default: null
  },
  lastStyleAnalysis: { type: Date },
  progress: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    completion: { type: Number, default: 0 },
    lastAccessed: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Add method to calculate learning style
userSchema.methods.calculateLearningStyle = function() {
  const { visualScore, auditoryScore, kinestheticScore, readingScore } = this.learningBehavior;
  const scores = {
    visual: visualScore,
    auditory: auditoryScore,
    kinesthetic: kinestheticScore,
    reading: readingScore
  };
  
  const dominantStyle = Object.entries(scores)
    .reduce((a, b) => a[1] > b[1] ? a : b)[0];
  
  this.analyzedLearningStyle = dominantStyle;
  this.lastStyleAnalysis = new Date();
};

export default mongoose.model('User', userSchema);
