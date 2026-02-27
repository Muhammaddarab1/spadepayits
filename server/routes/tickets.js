// Ticket routes: CRUD operations with role-based access
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { passwordGuard } from '../middleware/passwordGuard.js';
import { createTicket, listTickets, getTicket, updateTicket, updateStatus, deleteTicket } from '../controllers/ticketController.js';
import { requirePermission } from '../middleware/permission.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Ticket from '../models/Ticket.js';

const router = Router();

router.get('/', auth, passwordGuard, listTickets);
router.post('/', auth, passwordGuard, requirePermission('tickets.create'), createTicket);
router.get('/:id', auth, passwordGuard, getTicket);
router.put('/:id', auth, passwordGuard, updateTicket);
router.patch('/:id/status', auth, passwordGuard, updateStatus);
router.delete('/:id', auth, passwordGuard, requirePermission('tickets.delete'), deleteTicket);

// File attachments
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.post('/:id/attachments', auth, passwordGuard, upload.array('files', 5), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    const items = (req.files || []).map((f) => ({
      filename: f.originalname,
      url: `/uploads/${path.basename(f.path)}`,
      mimetype: f.mimetype,
      size: f.size,
      uploadedBy: req.user.id,
    }));
    ticket.attachments = [...(ticket.attachments || []), ...items];
    await ticket.save();
    return res.status(201).json({ attachments: items });
  } catch {
    return res.status(500).json({ message: 'Failed to upload attachments' });
  }
});

export default router;
