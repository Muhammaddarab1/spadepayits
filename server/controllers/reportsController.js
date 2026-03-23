// Reports controller for Admin/authorized users
import Ticket from '../models/Ticket.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

/**
 * Aggregates tickets by status/priority/deletion and outputs JSON, CSV, or PDF.
 * Query params:
 * - format: 'json' | 'csv' | 'pdf'
 */
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
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 36 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=\"ticket-summary.pdf\"');
      doc.pipe(res);
      doc.fontSize(16).text('Ticket Summary', { align: 'center' }).moveDown();
      const headers = ['Status', 'Priority', 'Deleted', 'Count'];
      doc.fontSize(10);
      doc.text(headers.join(' | '));
      doc.moveDown(0.5);
      summary.forEach(r => {
        doc.text([r.status, r.priority, String(r.isDeleted), String(r.count)].join(' | '));
      });
      doc.end();
      return;
    }
    return res.json({ summary });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to generate report' });
  }
};
