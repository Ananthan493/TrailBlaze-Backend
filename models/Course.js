import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: [{
    type: { type: String, enum: ['video', 'text', 'ar', 'quiz'] },
    title: String,
    data: mongoose.Schema.Types.Mixed,
    arModel: String,
    duration: Number
  }],
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  learningStyles: {
    type: [String],
    enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
    default: ['visual']
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'published', 'archived'],
    default: 'draft'
  },
  duration: { type: Number, required: true }, // in hours
  prerequisites: [String],
  skills: [String],
  objectives: [String],
  materials: [{
    type: { type: String, enum: ['pdf', 'video', 'link'] },
    title: String,
    url: String
  }],
  syllabus: [{
    week: Number,
    title: String,
    description: String,
    activities: [String]
  }]
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);
