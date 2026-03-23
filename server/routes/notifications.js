import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { listNotifications, markAsRead, markAllRead, deleteNotification } from '../controllers/notificationController.js';

const router = Router();

// All notification routes require authentication
router.get('/', auth, listNotifications);
router.patch('/:id/read', auth, markAsRead);
router.post('/read-all', auth, markAllRead);
router.delete('/:id', auth, deleteNotification);

export default router;
