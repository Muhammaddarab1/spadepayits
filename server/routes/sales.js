import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { passwordGuard } from '../middleware/passwordGuard.js';
import { requirePermission } from '../middleware/permission.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createSales, listSales, getSales, updateSales, deleteSales, addAttachments } from '../controllers/salesController.js';

const router = Router();

router.get('/', auth, passwordGuard, listSales);
router.get('/:id', auth, passwordGuard, getSales);
router.post('/', auth, passwordGuard, requirePermission('sales.create'), createSales);
router.patch('/:id', auth, passwordGuard, requirePermission('sales.update'), updateSales);

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });
router.post('/:id/attachments', auth, passwordGuard, upload.array('files', 5), addAttachments);

export default router;
