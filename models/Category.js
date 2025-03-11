import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true 
  },
  description: String,
  slug: {
    type: String,
    unique: true,
    lowercase: true
  }
}, { timestamps: true });

categorySchema.pre('save', function(next) {
  this.slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  next();
});

export default mongoose.model('Category', categorySchema);
