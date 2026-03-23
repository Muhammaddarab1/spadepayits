import SalesTicket from '../models/SalesTicket.js';
import User from '../models/User.js';
import path from 'path';
import { createInternalNotification } from './notificationController.js';

export const createSales = async (req, res) => {
  try {
    const {
      businessName, address, ownerName, taxFileName,
      contactPersonName, contactNumber, email, einOrSsn,
      turnaroundTime, dueAt, assignee, assignees, notes,
    } = req.body;
    if (!businessName || !address || !ownerName || !contactPersonName || !contactNumber || !email || !einOrSsn || !turnaroundTime || (!assignee && (!Array.isArray(assignees) || assignees.length === 0))) {
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
    // notify assignees via in-app notification
    (async () => {
      try {
        for (const assigneeId of resolvedAssignees) {
          await createInternalNotification({
            recipient: assigneeId,
            sender: req.user.id,
            title: '🎟️ New Sales Ticket Assigned',
            message: `You have been assigned to a new sales ticket for ${businessName}`,
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
    // Only Sales and Admin may view all sales tickets
    if (req.user.role !== 'Admin' && req.user.role !== 'Sales') return res.status(403).json({ message: 'Forbidden' });
    const filter = {};
    if (req.user.role !== 'Admin') filter.isDeleted = false;
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
      .populate('createdBy', 'name email role');
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json(item);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch sales ticket' });
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

    // Notify on changes
    (async () => {
      try {
        const newAssignees = item.assignees?.map(String) || [];
        const addedAssignees = newAssignees.filter(id => !oldAssignees.includes(id));
        
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
          const participants = new Set([...newAssignees, item.createdBy?.toString()].filter(Boolean));
          participants.delete(req.user.id);
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
