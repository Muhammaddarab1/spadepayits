// Ticket controller implements CRUD and role-based visibility
import Ticket from '../models/Ticket.js';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { createInternalNotification } from './notificationController.js';
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
    // Generate unique 6-digit ticket number
    const genSix = async () => {
      for (let i = 0; i < 6; i++) {
        const n = Math.floor(100000 + Math.random() * 900000).toString();
        const exists = await Ticket.findOne({ ticketNumber: n });
        if (!exists) return n;
      }
      // fallback to timestamp-derived value
      return (Date.now() % 1000000).toString().padStart(6, '0');
    };
    const ticketNumber = await genSix();

    const ticket = await Ticket.create({
      subject,
      description,
      assignee: resolvedAssignees[0],
      assignees: resolvedAssignees,
      ticketNumber,
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
    // Notify assignees and admins via in-app notification
    (async () => {
      try {
        const admins = await User.find({ role: 'Admin' }).select('_id');
        const adminIds = admins.map(a => a._id.toString());
        const recipients = new Set([...resolvedAssignees.map(String), ...adminIds]);
        // Don't notify the person who created the ticket
        recipients.delete(req.user.id.toString());
        
        for (const recipientId of recipients) {
          await createInternalNotification({
            recipient: recipientId,
            sender: req.user.id,
            title: '🎟️ New Ticket Assigned',
            message: `New ticket created: ${ticket.subject} (assigned to ${resolvedAssignees.length} members)`,
            link: `/tickets/${ticket._id}`,
            type: 'Assignment'
          });
        }
      } catch {}
    })();
    return res.status(201).json(ticket);
  } catch {
    return res.status(500).json({ message: 'Failed to create ticket' });
  }
};

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text required' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    const comment = { text: text.trim(), author: req.user.id, createdAt: new Date() };
    ticket.comments = [...(ticket.comments || []), comment];
    await ticket.save();
    await logActivity({ action: 'COMMENT_ADDED', user: req.user.id, ticket: ticket._id, details: `Comment added` });
    // notify ticket participants about comment
    (async () => {
      try {
        const admins = await User.find({ role: 'Admin' }).select('_id');
        const ids = new Set([
          ...(ticket.assignees||[]).map(String), 
          ticket.createdBy?.toString(),
          ...admins.map(a => a._id.toString())
        ].filter(Boolean));
        // Don't notify the person who added the comment
        ids.delete(req.user.id);
        for (const recipientId of ids) {
          await createInternalNotification({
            recipient: recipientId,
            sender: req.user.id,
            title: `💬 New Comment: ${ticket.ticketNumber}`,
            message: `${req.user.name} added a comment: "${comment.text.substring(0, 50)}${comment.text.length > 50 ? '...' : ''}"`,
            link: `/tickets/${ticket._id}`,
            type: 'Comment'
          });
        }
      } catch {}
    })();
    return res.status(201).json(comment);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to add comment' });
  }
};

export const listTickets = async (req, res) => {
  try {
    const canTs = req.user.role === 'Admin' || req.user.permissions?.['troubleshooting.viewMenu'];
    if (!canTs) return res.status(403).json({ message: 'Forbidden' });
    const { assignee, assignees, status, priority, tags, search } = req.query;
    const query = {};
    const ids = [];
    if (assignee) ids.push(assignee);
    if (assignees) assignees.split(',').forEach((i) => ids.push(i.trim()));
    
    const orConditions = [];
    if (search) {
      const pattern = new RegExp(search, 'i');
      orConditions.push({ subject: pattern }, { ticketNumber: pattern });
    }
    if (ids.length) {
      orConditions.push({ assignee: { $in: ids } }, { assignees: { $in: ids } });
    }
    if (orConditions.length) {
      query.$or = orConditions;
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (tags) query.tags = { $in: tags.split(',').map((t) => t.trim()) };

    const canViewAll = req.user.role === 'Admin' || req.user.permissions?.['tickets.viewAll'];
    if (!canViewAll) {
      const userId = new mongoose.Types.ObjectId(req.user.id);
      const own = { $or: [{ assignee: userId }, { assignees: userId }, { createdBy: userId }] };
      if (query.$or) {
        // If there was already an $or (e.g. from search), we must AND it with the ownership restriction
        const existingOr = query.$or;
        delete query.$or;
        query.$and = [{ $or: existingOr }, own];
      } else {
        query.$or = own.$or;
      }
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
    const inAssignees = (ticket.assignees || []).some((u) => u?._id?.toString() === req.user.id.toString());
    const isMine = ticket.assignee?._id?.toString() === req.user.id.toString() || inAssignees || ticket.createdBy?._id?.toString() === req.user.id.toString();
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
    
    // Track old assignee and status for notifications
    const oldAssignees = ticket.assignees?.map(String) || [];
    const oldStatus = ticket.status;
    
    Object.assign(ticket, updates);
    await ticket.save();
    await logActivity({
      action: 'UPDATE_TICKET',
      user: req.user.id,
      ticket: ticket._id,
      details: `Ticket updated by ${req.user.name}`,
    });
    
    // Notify on changes via in-app notification
    (async () => {
      try {
        const newAssignees = ticket.assignees?.map(String) || [];
        const addedAssignees = newAssignees.filter(id => !oldAssignees.includes(id));
        const admins = await User.find({ role: 'Admin' }).select('_id');
        const adminIds = admins.map(a => a._id.toString());
        
        // Notify new assignees
        for (const userId of addedAssignees) {
          await createInternalNotification({
            recipient: userId,
            sender: req.user.id,
            title: '🎟️ Ticket Assigned',
            message: `You have been assigned to ticket #${ticket.ticketNumber}`,
            link: `/tickets/${ticket._id}`,
            type: 'Assignment'
          });
        }
        
        // Notify all participants about status change or general update
        const participants = new Set([...newAssignees, ticket.createdBy?.toString(), ...adminIds].filter(Boolean));
        participants.delete(req.user.id);

        if (oldStatus !== ticket.status) {
          for (const userId of participants) {
            await createInternalNotification({
              recipient: userId,
              sender: req.user.id,
              title: '🔄 Status Changed',
              message: `Ticket #${ticket.ticketNumber} status changed: ${oldStatus} → ${ticket.status}`,
              link: `/tickets/${ticket._id}`,
              type: 'StatusChange'
            });
          }
        } else if (addedAssignees.length === 0) {
          // General update notification if status didn't change and no new assignees
          for (const userId of participants) {
            await createInternalNotification({
              recipient: userId,
              sender: req.user.id,
              title: '✏️ Ticket Updated',
              message: `Ticket #${ticket.ticketNumber} was updated by ${req.user.name}`,
              link: `/tickets/${ticket._id}`,
              type: 'System'
            });
          }
        }
      } catch {}
    })();
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
    // In-app notification on status change
    (async () => {
      try {
        const admins = await User.find({ role: 'Admin' }).select('_id');
        const ids = new Set([
          ...(ticket.assignees||[]).map(String), 
          ticket.createdBy?.toString(),
          ...admins.map(a => a._id.toString())
        ].filter(Boolean));
        ids.delete(req.user.id);
        for (const recipientId of ids) {
          await createInternalNotification({
            recipient: recipientId,
            sender: req.user.id,
            title: '🔄 Status Updated',
            message: `Ticket #${ticket.ticketNumber} is now ${status}`,
            link: `/tickets/${ticket._id}`,
            type: 'StatusChange'
          });
        }
      } catch {}
    })();
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
