// Reports routes
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { passwordGuard } from '../middleware/passwordGuard.js';
import { ticketSummary } from '../controllers/reportsController.js';

const router = Router();

router.get('/tickets', auth, passwordGuard, requirePermission('reports.generate'), ticketSummary);

export default router;
