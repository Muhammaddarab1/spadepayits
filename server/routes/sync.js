/**
 * Microsoft 365 Sync Routes
 * Admin-only endpoints for syncing users from Microsoft 365 tenant
 */
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { validateMicrosoftConfig } from '../utils/microsoftGraph.js';
import { syncUsersFromMicrosoft, getSyncStats, syncUserByEmail } from '../utils/userSync.js';

const router = Router();

/**
 * GET /api/sync/status
 * Get the current sync status and configuration
 * Admin only
 */
router.get('/status', auth, requirePermission('users.manage'), async (_req, res) => {
  try {
    const microsoftConfig = validateMicrosoftConfig();
    const syncStats = await getSyncStats();

    return res.json({
      microsoftConfigured: microsoftConfig.valid,
      microsoftMessage: microsoftConfig.message,
      syncStats,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to get sync status: ' + error.message });
  }
});

/**
 * POST /api/sync/users
 * Trigger a full sync of all users from Microsoft 365
 * Admin only
 */
router.post('/users', auth, requirePermission('users.manage'), async (_req, res) => {
  try {
    const microsoftConfig = validateMicrosoftConfig();
    if (!microsoftConfig.valid) {
      return res.status(400).json({
        message: 'Microsoft Azure is not configured',
        details: microsoftConfig.message,
      });
    }

    const summary = await syncUsersFromMicrosoft();

    return res.json({
      success: true,
      message: `Synced ${summary.total} users from Microsoft 365`,
      summary,
    });
  } catch (error) {
    console.error('User sync error:', error);
    return res.status(500).json({
      message: 'Failed to sync users: ' + error.message,
    });
  }
});

/**
 * POST /api/sync/user-by-email
 * Sync a specific user by email from Microsoft 365
 * Admin only
 */
router.post('/user-by-email', auth, requirePermission('users.manage'), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const result = await syncUserByEmail(email);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    return res.json({
      success: true,
      message: result.message,
      created: result.created,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to sync user: ' + error.message });
  }
});

export default router;
