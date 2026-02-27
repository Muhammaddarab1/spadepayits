// Attendance schema to track login, break, and logout events
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, enum: ['login', 'break_start', 'break_end', 'logout'], required: true },
    timestamp: { type: Date, default: Date.now, required: true, index: true },
    note: { type: String, default: '' },
  },
  { timestamps: false }
);

export default mongoose.model('Attendance', attendanceSchema);
