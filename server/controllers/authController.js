// Authentication controller manages register, login, and password reset flows
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { sendEmail } from '../utils/sendEmail.js';

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email, mustChangePassword: user.mustChangePassword }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });
    const user = await User.create({ name, email, password, role: 'Agent' });
    const roleDoc = user.role === 'Admin' ? null : await Role.findOne({ name: user.role });
    const basePerms = user.role === 'Admin' ? { admin: true } : roleDoc?.permissions || {};
    const permissions = user.role === 'Admin' ? basePerms : { ...basePerms, ...(user.permissions || {}) };
    const token = signToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, permissions, mustChangePassword: user.mustChangePassword } });
  } catch (e) {
    return res.status(500).json({ message: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await user.matchPassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const roleDoc = user.role === 'Admin' ? null : await Role.findOne({ name: user.role });
    const basePerms = user.role === 'Admin' ? { admin: true } : roleDoc?.permissions || {};
    const permissions = user.role === 'Admin' ? basePerms : { ...basePerms, ...(user.permissions || {}) };
    const token = signToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, permissions, mustChangePassword: user.mustChangePassword } });
  } catch {
    return res.status(500).json({ message: 'Login failed' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      html: `<p>Hello ${user.name},</p>
             <p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p>
             <p><a href="${resetLink}">${resetLink}</a></p>
             <p>If you did not request this, you can safely ignore this email.</p>`,
    });
    return res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to initiate password reset' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return res.json({ message: 'Password has been reset successfully' });
  } catch {
    return res.status(500).json({ message: 'Failed to reset password' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new passwords are required' });
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(401).json({ message: 'Session expired. Please log in again.' });
    const ok = await user.matchPassword(currentPassword);
    if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    const roleDoc = user.role === 'Admin' ? null : await Role.findOne({ name: user.role });
    const basePerms = user.role === 'Admin' ? { admin: true } : roleDoc?.permissions || {};
    const permissions = user.role === 'Admin' ? basePerms : { ...basePerms, ...(user.permissions || {}) };
    const token = signToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return res.json({ message: 'Password changed successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role, permissions, mustChangePassword: user.mustChangePassword } });
  } catch (e) {
    if (e?.name === 'ValidationError') {
      const msg = e.errors?.password?.message || 'Validation error';
      return res.status(400).json({ message: msg.includes('minlength') ? 'Password must be at least 8 characters' : msg });
    }
    return res.status(500).json({ message: 'Failed to change password' });
  }
};

export const logout = async (_req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return res.json({ message: 'Logged out' });
  } catch {
    return res.status(500).json({ message: 'Logout failed' });
  }
};
