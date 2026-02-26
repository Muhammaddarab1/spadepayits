// Ticket controller implements CRUD and role-based visibility
import Ticket from '../models/Ticket.js';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import { requirePermission } from '../middleware/permission.js';

const logActivity = async ({ action, user, ticket, details }) => {
  try {
    await ActivityLog.create({ action, user, ticket, details });
  } catch {
    // non-blocking
  }
};

export const createTicket = async (req, res) => {
  try {
    const { subject, description, assignee, assignees, tags, priority, status, dueAt, mid, dba, contactNumber, contactPerson, notes } = req.body;
    if (!subject || !description || (!assignee && (!Array.isArray(assignees) || assignees.length === 0)) || !Array.isArray(tags) || !priority || !status) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    // permission check deferred to middleware in route
    const resolvedAssignees = Array.isArray(assignees) && assignees.length ? assignees : [assignee];
    const users = await User.find({ _id: { $in: resolvedAssignees } }).select('_id');
    if (users.length !== resolvedAssignees.length) return res.status(404).json({ message: 'One or more assignees not found' });
    const ticket = await Ticket.create({
      subject,
      description,
      assignee: resolvedAssignees[0],
      assignees: resolvedAssignees,
      createdBy: req.user.id,
      tags,
      priority,
      status,
      dueAt: dueAt || null,
      mid: mid || '',
      dba: dba || '',
      contactNumber: contactNumber || '',
      contactPerson: contactPerson || '',
      notes: notes || '',
    });
    await logActivity({
      action: 'CREATE_TICKET',
      user: req.user.id,
      ticket: ticket._id,
      details: `Ticket created by ${req.user.name}`,
    });
    return res.status(201).json(ticket);
  } catch {
    return res.status(500).json({ message: 'Failed to create ticket' });
  }
};

export const listTickets = async (req, res) => {
  try {
    const { assignee, assignees, status, priority, tags } = req.query;
    const query = {};
    const ids = [];
    if (assignee) ids.push(assignee);
    if (assignees) assignees.split(',').forEach((i) => ids.push(i.trim()));
    if (ids.length) query.$or = [{ assignee: { $in: ids } }, { assignees: { $in: ids } }];
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (tags) query.tags = { $in: tags.split(',').map((t) => t.trim()) };

    const canViewAll = req.user.role === 'Admin' || req.user.permissions?.['tickets.viewAll'];
    if (!canViewAll) {
      const own = [{ assignee: req.user.id }, { assignees: req.user.id }, { createdBy: req.user.id }];
      query.$or = query.$or ? [...query.$or, ...own] : own;
    }
    // Exclude soft-deleted for non-admins
    if (req.user.role !== 'Admin') {
      query.isDeleted = false;
    }

    const tickets = await Ticket.find(query)
      .populate('assignee', 'name email role')
      .populate('assignees', 'name email role')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });
    return res.json(tickets);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch tickets' });
  }
};

export const getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('assignee', 'name email role')
      .populate('assignees', 'name email role')
      .populate('createdBy', 'name email role');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    const canViewAll = req.user.role === 'Admin' || req.user.permissions?.['tickets.viewAll'];
    const inAssignees = (ticket.assignees || []).some((u) => u?._id?.toString() === req.user.id);
    const isMine = ticket.assignee?._id?.toString() === req.user.id || inAssignees || ticket.createdBy?._id?.toString() === req.user.id;
    if (!canViewAll && !isMine) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.json(ticket);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch ticket' });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const allowedFields = ['subject', 'description', 'assignee', 'assignees', 'tags', 'priority', 'status', 'dueAt', 'mid', 'dba', 'contactNumber', 'contactPerson', 'notes'];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    const isAdmin = req.user.role === 'Admin';
    if (ticket.isDeleted && !isAdmin) return res.status(400).json({ message: 'Cannot modify deleted ticket' });
    Object.assign(ticket, updates);
    await ticket.save();
    await logActivity({
      action: 'UPDATE_TICKET',
      user: req.user.id,
      ticket: ticket._id,
      details: `Ticket updated by ${req.user.name}`,
    });
    return res.json(ticket);
  } catch {
    return res.status(500).json({ message: 'Failed to update ticket' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    const isAdmin = req.user.role === 'Admin';
    if (ticket.isDeleted && !isAdmin) return res.status(400).json({ message: 'Cannot modify deleted ticket' });
    ticket.status = status;
    await ticket.save();
    await logActivity({
      action: 'UPDATE_STATUS',
      user: req.user.id,
      ticket: ticket._id,
      details: `Status changed to ${status}`,
    });
    return res.json(ticket);
  } catch {
    return res.status(500).json({ message: 'Failed to update status' });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    // Soft delete: mark as deleted, keep for admin audit
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    const isAdmin = req.user.role === 'Admin';
    if (!isAdmin) return res.status(403).json({ message: 'Forbidden' });
    ticket.isDeleted = true;
    ticket.deletedAt = new Date();
    ticket.deletedBy = req.user.id;
    await ticket.save();
    await logActivity({
      action: 'DELETE_TICKET',
      user: req.user.id,
      ticket: ticket._id,
      details: `Ticket soft-deleted by ${req.user.name}`,
    });
    return res.json({ message: 'Ticket marked as deleted' });
  } catch {
    return res.status(500).json({ message: 'Failed to delete ticket' });
  }
};
