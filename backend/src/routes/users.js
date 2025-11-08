import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as usersController from '../controllers/usersController.js';
import { sendWelcomeWithCredentials, sendPasswordResetLink, sendBulkCredentials } from '../utils/emailService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get all users (HR only)
router.get('/users', authenticate, usersController.getAllUsers);

// Get user statistics (HR only)
router.get('/users/stats', authenticate, usersController.getUserStats);

// Get user by ID
router.get('/users/:id', authenticate, usersController.getUserById);

// Create new user (HR only)
router.post('/users', authenticate, authorize('admin', 'hr_officer'), usersController.createUser);

// Update user
router.put('/users/:id', authenticate, usersController.updateUser);

// Delete user (soft delete, HR only)
router.delete('/users/:id', authenticate, authorize('admin', 'hr_officer'), usersController.deleteUser);

// Reset user password (HR only)
router.post('/users/:id/reset-password', authenticate, authorize('admin', 'hr_officer'), usersController.resetUserPassword);

// Get all roles
router.get('/roles', authenticate, usersController.getAllRoles);

/**
 * Send welcome email with credentials to a specific user
 * POST /api/manage/send-credentials/:userId
 */
router.post('/send-credentials/:userId', authenticate, authorize('admin', 'hr_officer'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { temporaryPassword, loginUrl } = req.body;

    if (!temporaryPassword) {
      return res.status(400).json({ error: 'temporaryPassword is required' });
    }

    // Get user from database
    const db = (await import('../config/database.js')).default;
    const user = await db('users')
      .where({ id: userId })
      .select('id', 'email', 'full_name', 'role')
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send welcome email
    await sendWelcomeWithCredentials(
      user.email,
      user.full_name || 'User',
      temporaryPassword,
      loginUrl || 'http://localhost:5173'
    );

    logger.info(`Welcome email sent to ${user.email} by ${req.user.email}`);

    res.json({
      message: 'Credentials sent successfully',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      }
    });
  } catch (error) {
    logger.error('Send credentials error:', error);
    res.status(500).json({ error: 'Failed to send credentials' });
  }
});

/**
 * Send password reset link to user
 * POST /api/manage/send-reset-link/:userId
 */
router.post('/send-reset-link/:userId', authenticate, authorize('admin', 'hr_officer'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { resetLink, expiryHours } = req.body;

    if (!resetLink) {
      return res.status(400).json({ error: 'resetLink is required' });
    }

    // Get user from database
    const db = (await import('../config/database.js')).default;
    const user = await db('users')
      .where({ id: userId })
      .select('id', 'email', 'full_name')
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send password reset email
    await sendPasswordResetLink(
      user.email,
      resetLink,
      expiryHours || 24
    );

    logger.info(`Password reset link sent to ${user.email} by ${req.user.email}`);

    res.json({
      message: 'Password reset link sent successfully',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      }
    });
  } catch (error) {
    logger.error('Send reset link error:', error);
    res.status(500).json({ error: 'Failed to send reset link' });
  }
});

/**
 * Send bulk credentials to multiple users
 * POST /api/manage/send-bulk-credentials
 */
router.post('/send-bulk-credentials', authenticate, authorize('admin', 'hr_officer'), async (req, res) => {
  try {
    const { userIds, temporaryPasswords, loginUrl } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    if (!temporaryPasswords || userIds.length !== temporaryPasswords.length) {
      return res.status(400).json({ error: 'temporaryPasswords array must match userIds length' });
    }

    // Get users from database
    const db = (await import('../config/database.js')).default;
    const users = await db('users')
      .whereIn('id', userIds)
      .select('id', 'email', 'full_name', 'role');

    if (users.length === 0) {
      return res.status(404).json({ error: 'No users found' });
    }

    // Prepare users with temporary passwords
    const usersWithPasswords = users.map((user, index) => ({
      ...user,
      temporaryPassword: temporaryPasswords[index]
    }));

    // Send bulk credentials
    const results = await sendBulkCredentials(usersWithPasswords);

    logger.info(`Bulk credentials sent by ${req.user.email}:`, {
      sent: results.sent.length,
      failed: results.failed.length
    });

    res.json({
      message: 'Bulk credentials sent',
      results: {
        sent: results.sent.length,
        failed: results.failed.length,
        details: results
      }
    });
  } catch (error) {
    logger.error('Send bulk credentials error:', error);
    res.status(500).json({ error: 'Failed to send bulk credentials' });
  }
});

/**
 * Get email templates (for reference)
 * GET /api/manage/email-templates
 */
router.get('/email-templates', authenticate, authorize('admin', 'hr_officer'), (req, res) => {
  res.json({
    templates: {
      welcome: {
        name: 'Welcome with Credentials',
        endpoint: 'POST /api/manage/send-credentials/:userId',
        description: 'Send welcome email with login credentials to a new user',
        required_fields: ['temporaryPassword'],
        optional_fields: ['loginUrl']
      },
      reset: {
        name: 'Password Reset Link',
        endpoint: 'POST /api/manage/send-reset-link/:userId',
        description: 'Send password reset link to a user',
        required_fields: ['resetLink'],
        optional_fields: ['expiryHours']
      },
      bulk: {
        name: 'Bulk Credentials',
        endpoint: 'POST /api/manage/send-bulk-credentials',
        description: 'Send credentials to multiple users at once',
        required_fields: ['userIds', 'temporaryPasswords'],
        optional_fields: ['loginUrl']
      }
    },
    example_requests: {
      send_credentials: {
        method: 'POST',
        url: '/api/manage/send-credentials/1',
        body: {
          temporaryPassword: 'TempPass123@456',
          loginUrl: 'http://localhost:5173'
        }
      },
      send_reset_link: {
        method: 'POST',
        url: '/api/manage/send-reset-link/1',
        body: {
          resetLink: 'http://localhost:5173/reset-password?token=abc123xyz',
          expiryHours: 24
        }
      },
      send_bulk: {
        method: 'POST',
        url: '/api/manage/send-bulk-credentials',
        body: {
          userIds: [1, 2, 3],
          temporaryPasswords: ['Pass1@123', 'Pass2@456', 'Pass3@789'],
          loginUrl: 'http://localhost:5173'
        }
      }
    }
  });
});

export default router;
