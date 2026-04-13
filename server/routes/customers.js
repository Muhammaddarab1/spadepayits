import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  importCustomers,
  assignDevice,
  returnDevice,
  replaceDevice,
  processInspection
} from '../controllers/customerController.js';

const router = Router();

// Basic Customer permissions: viewing all is required for everyone usually, editing for Admin
router.get('/', auth, listCustomers);
router.get('/:id', auth, getCustomer);
router.post('/', auth, requirePermission('users.manage'), createCustomer); // Reusing manage permission for now
router.patch('/:id', auth, requirePermission('users.manage'), updateCustomer);
router.delete('/:id', auth, requirePermission('users.manage'), deleteCustomer);
router.post('/import', auth, requirePermission('users.manage'), importCustomers);

// Device management routes
router.post('/:id/devices/assign', auth, assignDevice);
router.post('/:id/devices/return', auth, returnDevice);
router.post('/:id/devices/replace', auth, replaceDevice);
router.post('/devices/inspect', auth, processInspection);

export default router;
