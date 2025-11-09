import express from 'express';
import { authenticate } from '../middleware/auth.js';
import authService from '../utils/authService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate credentials
    const validation = await authService.validateCredentials(email, password);

    if (!validation.valid) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({ error: validation.error });
    }

    // Generate JWT token
    const token = authService.generateToken(validation.user);

    // Log session
    await authService.logSession(validation.user.id, 'login');

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      token,
      user: validation.user
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await authService.getUserWithRole(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
    logger.info(`Profile accessed: ${req.user.email}`);
  } catch (error) {
    logger.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { full_name } = req.body;

    // Only allow updating full_name for now
    if (full_name) {
      const db = (await import('../config/database.js')).default;
      await db('users')
        .where({ id: req.user.id })
        .update({
          full_name,
          updated_at: new Date()
        });

      logger.info(`Profile updated: ${req.user.email}`);
    }

    const updatedUser = await authService.getUserWithRole(req.user.id);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Validate current password
    const validation = await authService.validateCredentials(
      req.user.email,
      current_password
    );

    if (!validation.valid) {
      logger.warn(`Invalid password attempt for: ${req.user.email}`);
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    const success = await authService.updatePassword(req.user.id, new_password);

    if (success) {
      logger.info(`Password changed for user: ${req.user.email}`);
      res.json({ message: 'Password changed successfully' });
    } else {
      res.status(500).json({ error: 'Failed to change password' });
    }
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token
router.post('/verify-token', authenticate, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user
  });
});

// Forgot password - Send reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const db = (await import('../config/database.js')).default;
    const { sendPasswordResetLink } = await import('../utils/emailService.js');
    const crypto = await import('crypto');

    // Check if user exists
    const user = await db('users').where({ email }).first();

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If the email exists, a password reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in database
    await db('users')
      .where({ id: user.id })
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry,
        updated_at: new Date()
      });

    // Send email with reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    await sendPasswordResetLink(
      user.email,
      user.full_name || 'User',
      resetLink,
      24
    );

    logger.info(`Password reset email sent to: ${email}`);
    res.json({ message: 'If the email exists, a password reset link has been sent' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const db = (await import('../config/database.js')).default;
    const bcrypt = await import('bcryptjs');

    // Find user with valid token
    const user = await db('users')
      .where({ reset_token: token })
      .where('reset_token_expiry', '>', new Date())
      .first();

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password and clear reset token
    await db('users')
      .where({ id: user.id })
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
        updated_at: new Date()
      });

    logger.info(`Password reset successful for user: ${user.email}`);
    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ===== EMAIL OTP VERIFICATION ROUTES =====
import * as otpController from '../controllers/otpController.js';

/**
 * Register with OTP verification
 * POST /api/auth/register-with-otp
 * Body: { full_name, email, password, role? }
 */
router.post('/register-with-otp', otpController.registerWithOtp);

/**
 * Verify OTP and activate account
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 */
router.post('/verify-otp', otpController.verifyOtp);

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 * Body: { email }
 */
router.post('/resend-otp', otpController.resendOtp);

export default router;
