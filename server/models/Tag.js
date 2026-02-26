import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true, trim: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Tag', tagSchema);
