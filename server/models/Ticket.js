// Ticket schema captures support requests and their lifecycle
import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    assignees: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [], index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tags: { type: [String], required: true, default: [], index: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    status: { type: String, enum: ['Open', 'In Progress', 'Solved'], required: true, default: 'Open' },
    dueAt: { type: Date, index: true },
    mid: { type: String, default: '' },
    dba: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    contactPerson: { type: String, default: '' },
    notes: { type: String, default: '' },
    attachments: [
      {
        filename: String,
        url: String,
        mimetype: String,
        size: Number,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Ticket', ticketSchema);
