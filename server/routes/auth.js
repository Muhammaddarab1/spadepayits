// Auth routes: login, forgot/reset password, change password
import { Router } from 'express';
import { login, forgotPassword, resetPassword, changePassword, logout } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
const router = Router();

// Public self-registration disabled; accounts are created by Admin via /api/users
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', auth, changePassword);
router.post('/logout', auth, logout);

export default router;
