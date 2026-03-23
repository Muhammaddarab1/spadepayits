import Ticket from '../models/Ticket.js';
import SalesTicket from '../models/SalesTicket.js';
import User from '../models/User.js';
import { sendBulkEmail } from './emailService.js';

const nowUtc = () => new Date();

const sendToParticipants = async (ticket, subject, html) => {
  const ids = new Set([...(ticket.assignees || []).map(String), ticket.createdBy?.toString()].filter(Boolean));
  const users = await User.find({ _id: { $in: Array.from(ids) } }).select('email');
  const recipients = users.map(u => u.email).filter(Boolean);
  if (recipients.length) await sendBulkEmail(recipients, subject, html);
};

const renderHtml = (title, lines) => {
  return `
    <div style="font-family:Arial,sans-serif;padding:20px;background:#F8FAFC">
      <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:8px;padding:20px">
        <h2 style="color:#0F172A;margin-top:0">${title}</h2>
        ${lines.map(l => `<p style="color:#0F172A;margin:8px 0">${l}</p>`).join('')}
      </div>
    </div>
  `;
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
          await sendToParticipants(t, `⏰ 24h Reminder: Ticket ${t.ticketNumber}`, renderHtml('24-hour Reminder', [
            `Ticket #${t.ticketNumber} (${t.subject}) is due within 24 hours.`,
            `Due at: ${new Date(t.dueAt).toLocaleString()}`,
          ]));
          t.reminder24Sent = true; await t.save();
        }
        if (!t.deadlineSent && t.dueAt <= now) {
          await sendToParticipants(t, `⚠️ Deadline Reached: Ticket ${t.ticketNumber}`, renderHtml('Turnaround Deadline Reached', [
            `Ticket #${t.ticketNumber} (${t.subject}) is past its due time.`,
            `Due at: ${new Date(t.dueAt).toLocaleString()}`,
          ]));
          t.deadlineSent = true; await t.save();
        }
      }
      // Sales tickets
      const sales = await SalesTicket.find({ dueAt: { $ne: null }, status: { $ne: 'Solved' } }).select('_id dueAt assignees createdBy reminder24Sent deadlineSent');
      for (const s of sales) {
        if (!s.dueAt) continue;
        if (!s.reminder24Sent && s.dueAt <= in24h && s.dueAt > now) {
          const ids = new Set([...(s.assignees || []).map(String), s.createdBy?.toString()].filter(Boolean));
          const users = await User.find({ _id: { $in: Array.from(ids) } }).select('email');
          const recipients = users.map(u => u.email).filter(Boolean);
          if (recipients.length) await sendBulkEmail(recipients, '⏰ 24h Reminder: Sales Ticket', renderHtml('24-hour Reminder', [
            `A sales ticket is due within 24 hours.`,
            `Due at: ${new Date(s.dueAt).toLocaleString()}`,
          ]));
          s.reminder24Sent = true; await s.save();
        }
        if (!s.deadlineSent && s.dueAt <= now) {
          const ids = new Set([...(s.assignees || []).map(String), s.createdBy?.toString()].filter(Boolean));
          const users = await User.find({ _id: { $in: Array.from(ids) } }).select('email');
          const recipients = users.map(u => u.email).filter(Boolean);
          if (recipients.length) await sendBulkEmail(recipients, '⚠️ Deadline Reached: Sales Ticket', renderHtml('Turnaround Deadline Reached', [
            `A sales ticket is past its due time.`,
            `Due at: ${new Date(s.dueAt).toLocaleString()}`,
          ]));
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
