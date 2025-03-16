import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  duration: {
    type: Number,
    required: true
  },
  learningStyles: [{
    type: String,
    enum: ['visual', 'auditory', 'reading', 'kinesthetic']
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  highlights: [{
    type: String,
    required: true
  }],
  outcomes: [{
    type: String,
    required: true
  }],
  prerequisites: [{
    type: String
  }],
  modules: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    topics: [{
      type: String,
      required: true
    }],
    order: {
      type: Number,
      required: true
    }
  }],
  content: [{
    type: {
      type: String,
      enum: ['text', 'video', 'ar', 'quiz'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    data: String,
    arModel: String,
    duration: Number,
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module'
    },
    order: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'ready', 'error'],
      default: 'ready'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update timestamps
courseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Course', courseSchema);
