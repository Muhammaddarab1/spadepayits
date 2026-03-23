import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // Link to the relevant ticket or page
    type: { 
      type: String, 
      enum: ['Assignment', 'StatusChange', 'Comment', 'Reminder', 'Deadline', 'System'],
      default: 'System' 
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
