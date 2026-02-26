import mongoose from 'mongoose';

const salesTicketSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    taxFileName: { type: String, default: '', trim: true },
    contactPersonName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    einOrSsn: { type: String, required: true, trim: true },
    turnaroundTime: { type: String, required: true, trim: true }, // e.g. "24h", "3 days"
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    assignees: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [], index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['Open', 'In Progress', 'Solved'], default: 'Open', index: true },
    dueAt: { type: Date, index: true },
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

export default mongoose.model('SalesTicket', salesTicketSchema);
