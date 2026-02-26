// ActivityLog schema records ticket-related actions for auditing
import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    details: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now, required: true },
  },
  { versionKey: false }
);

export default mongoose.model('ActivityLog', activityLogSchema);
