import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  issueDate: { type: Date, default: Date.now },
  blockchain: {
    transactionId: String,
    verificationUrl: String
  },
  template: { type: String, required: true },
  status: { type: String, enum: ['issued', 'revoked'], default: 'issued' }
});

export default mongoose.model('Certificate', certificateSchema);
