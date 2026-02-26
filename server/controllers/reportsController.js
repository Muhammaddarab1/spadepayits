// Reports controller for Admin/authorized users
import Ticket from '../models/Ticket.js';
import { Parser } from 'json2csv';

export const ticketSummary = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: { status: '$status', priority: '$priority', isDeleted: '$isDeleted' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.status': 1, '_id.priority': 1 } },
    ];
    const agg = await Ticket.aggregate(pipeline);
    const summary = agg.map((a) => ({
      status: a._id.status,
      priority: a._id.priority,
      isDeleted: a._id.isDeleted,
      count: a.count,
    }));
    const format = (req.query.format || 'json').toLowerCase();
    if (format === 'csv') {
      const parser = new Parser({ fields: ['status', 'priority', 'isDeleted', 'count'] });
      const csv = parser.parse(summary);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=\"ticket-summary.csv\"');
      return res.send(csv);
    }
    return res.json({ summary });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to generate report' });
  }
};
