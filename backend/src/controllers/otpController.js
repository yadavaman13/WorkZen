/**
 * OTP Verification Controller
 * Handles email OTP verification for user registration
 */

import db from '../config/database.js';
import { generateOtp, hashOtp, compareOtp, getOtpExpiry } from '../utils/otpUtil.js';
import { sendEmail } from '../utils/emailService.js';
import { otpEmailTemplate, otpResendTemplate, accountActivatedTemplate } from '../utils/mailTemplates.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

/**
 * Register new user and send OTP
 * POST /api/auth/register-with-otp
 */
export const registerWithOtp = async (req, res) => {
  const { full_name, email, password, role = 'employee' } = req.body;

  try {
    // Validate inputs
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await db('users').where({ email }).first();
    
    if (existingUser && existingUser.email_verified) {
      return res.status(400).json({ error: 'Email already registered. Please login.' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create or update user with pending status
    let userId;
    if (existingUser) {
      await db('users').where({ email }).update({
        full_name,
        password: hashedPassword,
        email_verified: false,
        updated_at: db.fn.now()
      });
      userId = existingUser.id;
    } else {
      const [newUser] = await db('users').insert({
        full_name,
        email,
        password: hashedPassword,
        role,
        email_verified: false,
        is_active: false
      }).returning('id');
      userId = newUser.id;
    }

    // Generate OTP
    const otp = generateOtp(6);
    const otpHash = await hashOtp(otp);
    const expiresAt = getOtpExpiry(10); // 10 minutes

    // Store OTP in database
    await db('email_otps').insert({
      email,
      otp_hash: otpHash,
      otp_plain: process.env.NODE_ENV === 'development' ? otp : null,
      expires_at: expiresAt,
      used: false,
      attempts: 0
    });

    // Send OTP email
    const emailHtml = otpEmailTemplate(full_name, otp, 10);
    await sendEmail(email, '🔐 Verify Your Email - WorkZen HRMS', emailHtml);

    // Audit log
    await db('audit_logs').insert({
      actor_email: email,
      action: 'OTP_SENT',
      details: `OTP sent for registration`,
      ip_address: req.ip
    });

    logger.info(`Registration OTP sent to ${email}`);

    res.status(200).json({
      message: 'Registration successful! Please check your email for verification code.',
      email
    });
  } catch (error) {
    logger.error('Registration with OTP error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

/**
 * Verify OTP and activate account
 * POST /api/auth/verify-otp
 */
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Get latest unused OTP for this email
    const otpRecord = await db('email_otps')
      .where({ email, used: false })
      .where('expires_at', '>', db.fn.now())
      .orderBy('created_at', 'desc')
      .first();

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      await db('email_otps').where({ id: otpRecord.id }).update({ used: true });
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP
    const isValid = await compareOtp(otp, otpRecord.otp_hash);

    if (!isValid) {
      // Increment attempts
      await db('email_otps').where({ id: otpRecord.id }).increment('attempts', 1);
      
      await db('audit_logs').insert({
        actor_email: email,
        action: 'OTP_VERIFY_FAILED',
        details: `Failed OTP verification attempt`,
        ip_address: req.ip
      });

      return res.status(400).json({ 
        error: 'Invalid OTP',
        attemptsRemaining: 5 - (otpRecord.attempts + 1)
      });
    }

    // Mark OTP as used
    await db('email_otps').where({ id: otpRecord.id }).update({ used: true });

    // Activate user account
    await db('users').where({ email }).update({
      email_verified: true,
      is_active: true,
      updated_at: db.fn.now()
    });

    // Get updated user
    const user = await db('users').where({ email }).first();

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Send activation success email
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const emailHtml = accountActivatedTemplate(user.full_name, loginUrl);
    await sendEmail(email, '✅ Account Activated - WorkZen HRMS', emailHtml);

    // Audit log
    await db('audit_logs').insert({
      actor_email: email,
      action: 'OTP_VERIFIED',
      details: `Account activated successfully`,
      ip_address: req.ip
    });

    logger.info(`Account verified and activated: ${email}`);

    res.status(200).json({
      message: 'Email verified successfully! Your account is now active.',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        email_verified: true
      }
    });
  } catch (error) {
    logger.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 */
export const resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await db('users').where({ email }).first();
    
    if (!user) {
      // Don't reveal if email exists
      return res.status(200).json({ message: 'If the email exists, a new OTP has been sent.' });
    }

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified. Please login.' });
    }

    // Mark previous OTPs as used
    await db('email_otps').where({ email, used: false }).update({ used: true });

    // Generate new OTP
    const otp = generateOtp(6);
    const otpHash = await hashOtp(otp);
    const expiresAt = getOtpExpiry(10);

    // Store new OTP
    await db('email_otps').insert({
      email,
      otp_hash: otpHash,
      otp_plain: process.env.NODE_ENV === 'development' ? otp : null,
      expires_at: expiresAt,
      used: false,
      attempts: 0
    });

    // Send OTP email
    const emailHtml = otpResendTemplate(user.full_name, otp, 10);
    await sendEmail(email, '🔄 New Verification Code - WorkZen HRMS', emailHtml);

    // Audit log
    await db('audit_logs').insert({
      actor_email: email,
      action: 'OTP_RESENT',
      details: `New OTP requested and sent`,
      ip_address: req.ip
    });

    logger.info(`OTP resent to ${email}`);

    res.status(200).json({ message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    logger.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP. Please try again.' });
  }
};
