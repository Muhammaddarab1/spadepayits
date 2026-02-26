// Activity log routes: view ticket audit history
import { Router } from 'express';
import { listActivityLogs } from '../controllers/activityLogController.js';
import { auth } from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';
import { passwordGuard } from '../middleware/passwordGuard.js';

const router = Router();

router.get('/', auth, passwordGuard, allowRoles('Admin', 'Sales', 'Finance'), listActivityLogs);

export default router;
