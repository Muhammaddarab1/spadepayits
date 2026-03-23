import Attendance from '../models/Attendance.js';
import Setting from '../models/Setting.js';

const getAttendanceEnabled = async () => {
  const s = await Setting.findOne({ key: 'attendance.enabled' });
  if (!s) return true;
  return Boolean(s.value);
};

export const getStatus = async (req, res) => {
  try {
    const enabled = await getAttendanceEnabled();
    if (!enabled) return res.json({ enabled, clockedIn: false, record: null });
    const today = new Date();
    const date = today.toISOString().slice(0, 10);
    const record = await Attendance.findOne({ user: req.user.id, date });
    return res.json({ enabled, clockedIn: Boolean(record && !record.clockOutAt), record });
  } catch {
    return res.status(500).json({ message: 'Failed to get attendance status' });
  }
};

export const clockIn = async (req, res) => {
  try {
    const enabled = await getAttendanceEnabled();
    if (!enabled) return res.status(400).json({ message: 'Attendance disabled' });
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const existing = await Attendance.findOne({ user: req.user.id, date });
    if (existing) {
      if (!existing.clockOutAt) return res.status(400).json({ message: 'Already clocked in' });
      existing.clockInAt = now;
      existing.clockOutAt = null;
      await existing.save();
      return res.json(existing);
    }
    const record = await Attendance.create({
      user: req.user.id,
      clockInAt: now,
      date,
    });
    return res.status(201).json(record);
  } catch {
    return res.status(500).json({ message: 'Failed to clock in' });
  }
};

export const clockOut = async (req, res) => {
  try {
    const enabled = await getAttendanceEnabled();
    if (!enabled) return res.status(400).json({ message: 'Attendance disabled' });
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const record = await Attendance.findOne({ user: req.user.id, date });
    if (!record || record.clockOutAt) return res.status(400).json({ message: 'Not clocked in' });
    record.clockOutAt = now;
    await record.save();
    return res.json(record);
  } catch {
    return res.status(500).json({ message: 'Failed to clock out' });
  }
};
