import Notification from '../models/Notification.js';

/**
 * GET /api/notifications
 * Get current user's notifications (paged/limited)
 */
export const listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load notifications' });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    return res.json(notification);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update notification' });
  }
};

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for current user
 */
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update notifications' });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete notification' });
  }
};

/**
 * Utility to create notifications internally (not an API endpoint)
 */
export const createInternalNotification = async ({ recipient, sender, title, message, link, type }) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      title,
      message,
      link,
      type
    });
    return notification;
  } catch (error) {
    console.error('Failed to create internal notification:', error.message);
    return null;
  }
};
