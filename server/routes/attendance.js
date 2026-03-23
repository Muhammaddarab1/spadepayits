// Attendance routes: Clock In / Clock Out
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { passwordGuard } from '../middleware/passwordGuard.js';
import { clockIn, clockOut, getStatus } from '../controllers/attendanceController.js';

const router = Router();

router.get('/status', auth, passwordGuard, getStatus);
router.post('/clock-in', auth, passwordGuard, clockIn);
router.post('/clock-out', auth, passwordGuard, clockOut);

export default router;
