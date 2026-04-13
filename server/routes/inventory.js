import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { listInventory, createOrUpdateDevice, deleteDevice } from '../controllers/inventoryController.js';

const router = Router();

router.get('/', auth, listInventory);
router.post('/', auth, createOrUpdateDevice);
router.delete('/:id', auth, deleteDevice);

export default router;
