// Activity log controller surfaces audit history for tickets
import ActivityLog from '../models/ActivityLog.js';

export const listActivityLogs = async (req, res) => {
  try {
    const { ticket, salesTicket } = req.query;
    const query = {};
    if (ticket) query.ticket = ticket;
    if (salesTicket) query.salesTicket = salesTicket;
    
    const logs = await ActivityLog.find(query)
      .populate('user', 'name email role')
      .populate('ticket', 'subject')
      .populate('salesTicket', 'businessName')
      .sort({ timestamp: -1 });
    return res.json(logs);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
};
