import SalesTicket from '../models/SalesTicket.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import path from 'path';
import { createInternalNotification } from './notificationController.js';

const logActivity = async ({ action, user, salesTicket, details }) => {
  try {
    await ActivityLog.create({ action, user, salesTicket, details });
  } catch {
    // non-blocking
  }
};

export const createSales = async (req, res) => {
  try {
    const {
      businessName, address, ownerName, taxFileName,
      contactPersonName, contactNumber, email, einOrSsn,
      turnaroundTime, dueAt, assignee, assignees, notes,
    } = req.body;

    const hasAssignee = assignee || (Array.isArray(assignees) && assignees.length > 0);

    if (!businessName || !address || !ownerName || !contactPersonName || !contactNumber || !email || !einOrSsn || !turnaroundTime || !hasAssignee) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    const resolvedAssignees = Array.isArray(assignees) && assignees.length ? assignees : [assignee];
    const users = await User.find({ _id: { $in: resolvedAssignees } }).select('_id');
    if (users.length !== resolvedAssignees.length) return res.status(404).json({ message: 'One or more assignees not found' });
    const doc = await SalesTicket.create({
      businessName, address, ownerName, taxFileName,
      contactPersonName, contactNumber, email, einOrSsn,
      turnaroundTime, dueAt: dueAt || null, assignee: resolvedAssignees[0], assignees: resolvedAssignees, createdBy: req.user.id, notes,
    });
    await logActivity({
      action: 'CREATE_SALES_TICKET',
      user: req.user.id,
      salesTicket: doc._id,
      details: `Sales ticket created for ${businessName}`,
    });
    // notify assignees and admins via in-app notification
    (async () => {
      try {
        const admins = await User.find({ role: 'Admin' }).select('_id');
        const adminIds = admins.map(a => a._id.toString());
        const recipients = new Set([...resolvedAssignees.map(String), ...adminIds]);
        recipients.delete(req.user.id.toString());
        
        for (const recipientId of recipients) {
          await createInternalNotification({
            recipient: recipientId,
            sender: req.user.id,
            title: '🎟️ New Sales Ticket Assigned',
            message: `New sales ticket for ${businessName} (assigned to ${resolvedAssignees.length} members)`,
            link: `/sales/${doc._id}`,
            type: 'Assignment'
          });
        }
      } catch {}
    })();
    return res.status(201).json(doc);
  } catch {
    return res.status(500).json({ message: 'Failed to create sales ticket' });
  }
};

export const listSales = async (req, res) => {
  try {
    const canSales = req.user.role === 'Admin' || req.user.permissions?.['sales.viewMenu'];
    if (!canSales) return res.status(403).json({ message: 'Forbidden' });
    const filter = {};
    if (req.user.role !== 'Admin') filter.isDeleted = false;
    // Further filter for non-admins if they don't have viewAll
    if (req.user.role !== 'Admin' && !req.user.permissions?.['sales.viewAll']) {
      filter.$or = [{ assignee: req.user.id }, { assignees: req.user.id }, { createdBy: req.user.id }];
    }
    const items = await SalesTicket.find(filter)
      .populate('assignee', 'name email role')
      .populate('assignees', 'name email role')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });
    return res.json(items);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch sales tickets' });
  }
};

export const getSales = async (req, res) => {
  try {
    const item = await SalesTicket.findById(req.params.id)
      .populate('assignee', 'name email role')
      .populate('assignees', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('comments.author', 'name email avatar');
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json(item);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch sales ticket' });
  }
};

export const addSalesComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text required' });
    const item = await SalesTicket.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Sales ticket not found' });
    const comment = { text: text.trim(), author: req.user.id, createdAt: new Date() };
    item.comments = [...(item.comments || []), comment];
    await item.save();
    await logActivity({ action: 'SALES_COMMENT_ADDED', user: req.user.id, salesTicket: item._id, details: `Comment added to sales ticket` });
    
    // notify ticket participants about comment
    (async () => {
      try {
        const admins = await User.find({ role: 'Admin' }).select('_id');
        const ids = new Set([
          ...(item.assignees||[]).map(String), 
          item.createdBy?.toString(),
          ...admins.map(a => a._id.toString())
        ].filter(Boolean));
        ids.delete(req.user.id.toString());
        for (const recipientId of ids) {
          await createInternalNotification({
            recipient: recipientId,
            sender: req.user.id,
            title: `💬 New Comment: ${item.businessName}`,
            message: `${req.user.name} added a comment to sales ticket: "${comment.text.substring(0, 50)}${comment.text.length > 50 ? '...' : ''}"`,
            link: `/sales/${item._id}`,
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

export const updateSales = async (req, res) => {
  try {
    const allowed = ['businessName','address','ownerName','taxFileName','contactPersonName','contactNumber','email','einOrSsn','turnaroundTime','dueAt','assignee','assignees','status','notes'];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    const item = await SalesTicket.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    // Permission to update is enforced by route middleware
    // Track for notifications
    const oldAssignees = item.assignees?.map(String) || [];
    const oldStatus = item.status;

    if (Array.isArray(updates.assignees) && updates.assignees.length) {
      item.assignees = updates.assignees;
      item.assignee = updates.assignees[0];
    } else if (updates.assignee) {
      item.assignee = updates.assignee;
      if (!item.assignees || item.assignees.length === 0) item.assignees = [updates.assignee];
    }
    if (updates.status) item.status = updates.status;
    if (updates.businessName !== undefined) item.businessName = updates.businessName;
    if (updates.address !== undefined) item.address = updates.address;
    if (updates.ownerName !== undefined) item.ownerName = updates.ownerName;
    if (updates.taxFileName !== undefined) item.taxFileName = updates.taxFileName;
    if (updates.contactPersonName !== undefined) item.contactPersonName = updates.contactPersonName;
    if (updates.contactNumber !== undefined) item.contactNumber = updates.contactNumber;
    if (updates.email !== undefined) item.email = updates.email;
    if (updates.einOrSsn !== undefined) item.einOrSsn = updates.einOrSsn;
    if (updates.turnaroundTime !== undefined) item.turnaroundTime = updates.turnaroundTime;
    if (updates.notes !== undefined) item.notes = updates.notes;
    await item.save();
    await logActivity({
      action: 'UPDATE_SALES_TICKET',
      user: req.user.id,
      salesTicket: item._id,
      details: `Sales ticket for ${item.businessName} updated`,
    });

    // Notify on changes
    (async () => {
      try {
        const newAssignees = item.assignees?.map(String) || [];
        const addedAssignees = newAssignees.filter(id => !oldAssignees.includes(id));
        const admins = await User.find({ role: 'Admin' }).select('_id');
        const adminIds = admins.map(a => a._id.toString());
        
        // Notify new assignees
        for (const userId of addedAssignees) {
          await createInternalNotification({
            recipient: userId,
            sender: req.user.id,
            title: '🎟️ Sales Ticket Assigned',
            message: `You have been assigned to sales ticket for ${item.businessName}`,
            link: `/sales/${item._id}`,
            type: 'Assignment'
          });
        }
        
        // Notify all participants about status change
        if (oldStatus !== item.status) {
          const participants = new Set([...newAssignees, item.createdBy?.toString(), ...adminIds].filter(Boolean));
          participants.delete(req.user.id.toString());
          for (const userId of participants) {
            await createInternalNotification({
              recipient: userId,
              sender: req.user.id,
              title: '🔄 Sales Status Changed',
              message: `Sales ticket for ${item.businessName} status changed: ${oldStatus} → ${item.status}`,
              link: `/sales/${item._id}`,
              type: 'StatusChange'
            });
          }
        }
      } catch {}
    })();
    return res.json(item);
  } catch {
    return res.status(500).json({ message: 'Failed to update sales ticket' });
  }
};

export const deleteSales = async (req, res) => {
  try {
    const item = await SalesTicket.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Forbidden' });
    item.isDeleted = true; item.deletedAt = new Date(); item.deletedBy = req.user.id;
    await item.save();
    return res.json({ message: 'Sales ticket marked as deleted' });
  } catch {
    return res.status(500).json({ message: 'Failed to delete sales ticket' });
  }
};

export const addAttachments = async (req, res) => {
  try {
    const item = await SalesTicket.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    const files = (req.files || []).map((f) => ({
      filename: f.originalname,
      url: `${req.protocol}://${req.get('host')}/uploads/${path.basename(f.path)}`,
      mimetype: f.mimetype,
      size: f.size,
      uploadedBy: req.user.id,
    }));
    item.attachments = [...(item.attachments || []), ...files];
    await item.save();
    return res.status(201).json({ attachments: files });
  } catch {
    return res.status(500).json({ message: 'Failed to upload attachments' });
  }
};
