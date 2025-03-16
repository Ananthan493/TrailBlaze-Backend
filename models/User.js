import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  completion: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  contentProgress: {
    type: Map,
    of: Number,
    default: () => new Map()
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  completionDate: Date,
  certificatePath: String,
  quizScores: [{
    quizId: mongoose.Schema.Types.ObjectId,
    score: Number,
    completedAt: Date
  }]
});

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
  progress: {
    type: [progressSchema],
    default: []
  },
  learningBehavior: {
    visualEngagement: { type: Number, default: 0 },
    auditoryEngagement: { type: Number, default: 0 },
    kinestheticEngagement: { type: Number, default: 0 },
    readingEngagement: { type: Number, default: 0 },
    totalEngagement: { type: Number, default: 0 },
    lastAnalysis: { type: Date }
  },
  achievements: [{
    title: { type: String },
    description: { type: String },
    earnedAt: { type: Date, default: Date.now },
    icon: { type: String }
  }],
  stats: {
    weeklyProgress: { type: Number, default: 0 },
    coursesStarted: { type: Number, default: 0 },
    coursesCompleted: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date }
  },
  analyzedLearningStyle: {
    type: String,
    enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
    default: 'visual'
  },
  lastStyleAnalysis: { type: Date },
  profilePicture: String,
  bio: String,
  phone: String,
  socialLinks: {
    linkedin: String,
    github: String,
    twitter: String
  }
}, { timestamps: true });

// Add middleware to ensure progress is always initialized
userSchema.pre('save', function(next) {
  if (!this.progress) {
    this.progress = [];
  }
  next();
});

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

userSchema.methods.analyzeLearningStyle = function() {
  const behavior = this.learningBehavior;
  const total = behavior.visualEngagement + 
                behavior.auditoryEngagement + 
                behavior.kinestheticEngagement + 
                behavior.readingEngagement;

  if (total === 0) return null;

  return {
    visual: (behavior.visualEngagement / total) * 100,
    auditory: (behavior.auditoryEngagement / total) * 100,
    kinesthetic: (behavior.kinestheticEngagement / total) * 100,
    reading: (behavior.readingEngagement / total) * 100
  };
};

export default mongoose.model('User', userSchema);
