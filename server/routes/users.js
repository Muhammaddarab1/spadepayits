// User routes: administrative user listing and self profile
import { Router } from 'express';
import { listUsers, getMe, createUser, updateUserRole, deleteUser, updateUserPermissions } from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { passwordGuard } from '../middleware/passwordGuard.js';

const router = Router();

// Directory visible to authenticated users to allow ticket assignment
router.get('/', auth, passwordGuard, listUsers);
router.get('/me', auth, getMe);
router.post('/', auth, passwordGuard, requirePermission('users.manage'), createUser);
router.patch('/:id/role', auth, passwordGuard, requirePermission('users.manage'), updateUserRole);
router.patch('/:id/permissions', auth, passwordGuard, requirePermission('users.manage'), updateUserPermissions);
router.delete('/:id', auth, passwordGuard, requirePermission('accounts.delete'), deleteUser);

export default router;
