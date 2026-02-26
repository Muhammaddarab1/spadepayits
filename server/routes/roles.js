// Roles routes to manage role-based permissions
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { passwordGuard } from '../middleware/passwordGuard.js';
import { listRoles, createRole, updateRole, deleteRole } from '../controllers/roleController.js';

const router = Router();

router.get('/', auth, passwordGuard, requirePermission('roles.manage'), listRoles);
router.post('/', auth, passwordGuard, requirePermission('roles.manage'), createRole);
router.patch('/:id', auth, passwordGuard, requirePermission('roles.manage'), updateRole);
router.delete('/:id', auth, passwordGuard, requirePermission('roles.manage'), deleteRole);

export default router;
