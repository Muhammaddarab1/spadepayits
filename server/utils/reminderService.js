import Ticket from '../models/Ticket.js';
import SalesTicket from '../models/SalesTicket.js';
import User from '../models/User.js';
import { createInternalNotification } from '../controllers/notificationController.js';

const nowUtc = () => new Date();

const notifyParticipants = async (ticket, title, message, type) => {
  const ids = new Set([...(ticket.assignees || []).map(String), ticket.createdBy?.toString()].filter(Boolean));
  const link = `/tickets/${ticket._id}`; // Base link, though sales uses different paths, this is fine for now
  for (const id of ids) {
    await createInternalNotification({
      recipient: id,
      title,
      message,
      link,
      type
    });
  }
};

export const startReminderService = () => {
  const check = async () => {
    try {
      const now = nowUtc();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      // Tickets: due reminders
      const tickets = await Ticket.find({ dueAt: { $ne: null }, status: { $ne: 'Solved' } }).select('_id subject ticketNumber dueAt assignees createdBy reminder24Sent deadlineSent');
      for (const t of tickets) {
        if (!t.dueAt) continue;
        if (!t.reminder24Sent && t.dueAt <= in24h && t.dueAt > now) {
          await notifyParticipants(t, '⏰ 24h Reminder', `Ticket #${t.ticketNumber} (${t.subject}) is due within 24 hours.`, 'Reminder');
          t.reminder24Sent = true; await t.save();
        }
        if (!t.deadlineSent && t.dueAt <= now) {
          await notifyParticipants(t, '⚠️ Deadline Reached', `Ticket #${t.ticketNumber} (${t.subject}) is past its due time.`, 'Deadline');
          t.deadlineSent = true; await t.save();
        }
      }
      // Sales tickets
      const sales = await SalesTicket.find({ dueAt: { $ne: null }, status: { $ne: 'Solved' } }).select('_id businessName dueAt assignees createdBy reminder24Sent deadlineSent');
      for (const s of sales) {
        if (!s.dueAt) continue;
        if (!s.reminder24Sent && s.dueAt <= in24h && s.dueAt > now) {
          await notifyParticipants(s, '⏰ 24h Reminder', `Sales Ticket (${s.businessName}) is due within 24 hours.`, 'Reminder');
          s.reminder24Sent = true; await s.save();
        }
        if (!s.deadlineSent && s.dueAt <= now) {
          await notifyParticipants(s, '⚠️ Deadline Reached', `Sales Ticket (${s.businessName}) is past its due time.`, 'Deadline');
          s.deadlineSent = true; await s.save();
        }
      }
    } catch (e) {
      console.error('Reminder service error:', e.message);
    }
  };
  // Check every 15 minutes
  setInterval(check, 15 * 60 * 1000);
  // Initial check shortly after start
  setTimeout(check, 10 * 1000);
};
