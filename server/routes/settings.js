import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import Setting from '../models/Setting.js';

const router = Router();

export default router;
