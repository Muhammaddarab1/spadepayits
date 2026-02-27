// Role schema defines configurable permissions for RBAC
import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true, trim: true },
    permissions: {
      type: Object,
      default: {},
    },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Role', roleSchema);
