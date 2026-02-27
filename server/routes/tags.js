import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { passwordGuard } from '../middleware/passwordGuard.js';
import { requirePermission } from '../middleware/permission.js';
import { listTags, listAllTags, createTag, updateTag, deleteTag } from '../controllers/tagController.js';

const router = Router();

router.get('/', auth, passwordGuard, listTags);
router.get('/all', auth, passwordGuard, requirePermission('tags.manage'), listAllTags);
router.post('/', auth, passwordGuard, requirePermission('tags.manage'), createTag);
router.patch('/:id', auth, passwordGuard, requirePermission('tags.manage'), updateTag);
router.delete('/:id', auth, passwordGuard, requirePermission('tags.manage'), deleteTag);

export default router;
