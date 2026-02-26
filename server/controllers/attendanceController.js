// Attendance controller for recording events and generating reports
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import LeaveRequest from '../models/LeaveRequest.js';
import AttendanceCorrection from '../models/AttendanceCorrection.js';

export const record = async (req, res) => {
  try {
    const { action, note } = req.body;
    if (!['login', 'break_start', 'break_end', 'logout'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }
    const doc = await Attendance.create({ user: req.user.id, action, note });
    return res.status(201).json(doc);
  } catch {
    return res.status(500).json({ message: 'Failed to record attendance' });
  }
};

export const report = async (req, res) => {
  try {
    const { start, end, month, userId } = req.query;
    let startDate, endDate;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 0, 23, 59, 59, 999);
    } else {
      startDate = start ? new Date(start) : new Date('1970-01-01');
      endDate = end ? new Date(end) : new Date();
    }
    const filter = { timestamp: { $gte: startDate, $lte: endDate } };
    if (userId) filter.user = userId;
    const entries = await Attendance.find(filter).populate('user', 'name email role').sort({ timestamp: 1 });
    return res.json({ range: { start: startDate, end: endDate }, count: entries.length, entries });
  } catch {
    return res.status(500).json({ message: 'Failed to generate report' });
  }
};

export const submitLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason) return res.status(400).json({ message: 'All fields are required' });
    const doc = await LeaveRequest.create({ user: req.user.id, startDate, endDate, reason });
    return res.status(201).json(doc);
  } catch {
    return res.status(500).json({ message: 'Failed to submit leave' });
  }
};

export const myLeaves = async (req, res) => {
  try {
    const items = await LeaveRequest.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json(items);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch leaves' });
  }
};

export const pendingLeaves = async (_req, res) => {
  try {
    const items = await LeaveRequest.find({ status: 'pending' }).populate('user', 'name email').sort({ createdAt: -1 });
    return res.json(items);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch pending leaves' });
  }
};

export const decideLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { approve, note } = req.body;
    const doc = await LeaveRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    doc.status = approve ? 'approved' : 'rejected';
    doc.approver = req.user.id;
    doc.decisionNote = note || '';
    await doc.save();
    return res.json(doc);
  } catch {
    return res.status(500).json({ message: 'Failed to decide leave' });
  }
};

export const submitCorrection = async (req, res) => {
  try {
    const { date, newClockIn, newClockOut, reason } = req.body;
    if (!date || !reason || (!newClockIn && !newClockOut)) return res.status(400).json({ message: 'Provide date, reason, and at least one time' });
    const doc = await AttendanceCorrection.create({ user: req.user.id, date, newClockIn, newClockOut, reason });
    return res.status(201).json(doc);
  } catch {
    return res.status(500).json({ message: 'Failed to submit correction' });
  }
};

export const myCorrections = async (req, res) => {
  try {
    const items = await AttendanceCorrection.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json(items);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch corrections' });
  }
};

export const pendingCorrections = async (_req, res) => {
  try {
    const items = await AttendanceCorrection.find({ status: 'pending' }).populate('user', 'name email').sort({ createdAt: -1 });
    return res.json(items);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch pending corrections' });
  }
};

export const decideCorrection = async (req, res) => {
  try {
    const { id } = req.params;
    const { approve, note } = req.body;
    const doc = await AttendanceCorrection.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    doc.status = approve ? 'approved' : 'rejected';
    doc.approver = req.user.id;
    doc.decisionNote = note || '';
    await doc.save();
    return res.json(doc);
  } catch {
    return res.status(500).json({ message: 'Failed to decide correction' });
  }
};
