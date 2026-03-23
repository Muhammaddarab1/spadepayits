// User schema defines application users and credentials
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, required: true, default: 'User' }, // baseline role; permissions primarily per-user
    permissions: { type: Object, default: {} },
    avatar: { type: String, default: '' },
    title: { type: String, default: '' },
    phone: { type: String, default: '' },
    // Microsoft 365 integration
    microsoftId: { type: String, index: true },
    department: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
    // Password reset flow
    mustChangePassword: { type: Boolean, default: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    // Account lifecycle
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Hash password when modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare candidate password with stored hash
userSchema.methods.matchPassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
