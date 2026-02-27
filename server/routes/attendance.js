// Attendance routes for recording events and reports
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { passwordGuard } from '../middleware/passwordGuard.js';
import { record, report, submitLeave, myLeaves, pendingLeaves, decideLeave, submitCorrection, myCorrections, pendingCorrections, decideCorrection } from '../controllers/attendanceController.js';

const router = Router();

router.post('/record', auth, passwordGuard, requirePermission('attendance.record'), record);
router.get('/report', auth, passwordGuard, requirePermission('attendance.report'), report);
router.post('/leave', auth, passwordGuard, requirePermission('attendance.requestLeave'), submitLeave);
router.get('/leave/mine', auth, passwordGuard, myLeaves);
router.get('/leave/pending', auth, passwordGuard, requirePermission('attendance.approveRequests'), pendingLeaves);
router.patch('/leave/:id/decision', auth, passwordGuard, requirePermission('attendance.approveRequests'), decideLeave);
router.post('/corrections', auth, passwordGuard, requirePermission('attendance.requestCorrection'), submitCorrection);
router.get('/corrections/mine', auth, passwordGuard, myCorrections);
router.get('/corrections/pending', auth, passwordGuard, requirePermission('attendance.approveRequests'), pendingCorrections);
router.patch('/corrections/:id/decision', auth, passwordGuard, requirePermission('attendance.approveRequests'), decideCorrection);

export default router;
