// User routes: administrative user listing and self profile
import { Router } from 'express';
import { listUsers, getMe, createUser, updateUserRole, deleteUser, updateUserPermissions, updateMe } from '../controllers/userController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { auth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { passwordGuard } from '../middleware/passwordGuard.js';

const router = Router();

// Directory visible to authenticated users to allow ticket assignment
router.get('/', auth, passwordGuard, listUsers);
router.get('/me', auth, getMe);
// profile update with optional avatar upload
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({ destination: (_req, _file, cb) => cb(null, uploadDir), filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`) });
const upload = multer({ storage });
router.patch('/me', auth, upload.single('avatar'), updateMe);
router.post('/', auth, passwordGuard, requirePermission('users.manage'), createUser);
router.patch('/:id/role', auth, passwordGuard, requirePermission('users.manage'), updateUserRole);
router.patch('/:id/permissions', auth, passwordGuard, requirePermission('users.manage'), updateUserPermissions);
router.delete('/:id', auth, passwordGuard, requirePermission('accounts.delete'), deleteUser);

export default router;
