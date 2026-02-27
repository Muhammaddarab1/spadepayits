import mongoose from 'mongoose';

const correctionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    newClockIn: { type: Date },
    newClockOut: { type: Date },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    decisionNote: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('AttendanceCorrection', correctionSchema);
