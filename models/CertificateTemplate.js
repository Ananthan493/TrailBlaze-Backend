import mongoose from 'mongoose';

const certificateTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true
  },
  design: {
    type: String,
    required: [true, 'Design is required'],
    enum: ['default', 'modern', 'classic', 'minimalist']
  },
  variables: [{
    key: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'date', 'number'],
      default: 'text'
    }
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add pre-save middleware to ensure valid data
certificateTemplateSchema.pre('save', function(next) {
  // Ensure at least one variable exists
  if (!this.variables || this.variables.length === 0) {
    this.variables = [
      { key: 'studentName', label: 'Student Name', type: 'text' },
      { key: 'courseName', label: 'Course Name', type: 'text' },
      { key: 'completionDate', label: 'Completion Date', type: 'date' }
    ];
  }
  next();
});

export default mongoose.model('CertificateTemplate', certificateTemplateSchema);
