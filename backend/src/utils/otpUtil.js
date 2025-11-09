/**
 * OTP Utility Functions
 * Handles OTP generation, hashing, and comparison for email verification
 * Uses bcrypt for secure hashing
 */

import crypto from 'crypto';
import bcryptjs from 'bcryptjs';

/**
 * Generate a 6-digit numeric OTP
 * @param {number} digits - Number of digits (default: 6)
 * @returns {string} Generated OTP
 */
export const generateOtp = (digits = 6) => {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return String(Math.floor(Math.random() * (max - min + 1) + min));
};

/**
 * Hash OTP using bcrypt (recommended for security)
 * @param {string} otp - Plain OTP to hash
 * @returns {Promise<string>} Hashed OTP
 */
export const hashOtp = async (otp) => {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(otp, salt);
};

/**
 * Compare plain OTP with hashed OTP
 * @param {string} otp - Plain OTP from user
 * @param {string} hash - Hashed OTP from database
 * @returns {Promise<boolean>} True if match
 */
export const compareOtp = async (otp, hash) => {
  return bcryptjs.compare(otp, hash);
};

/**
 * Alternative: HMAC-SHA256 hash for constant-time comparison
 * Less CPU heavy than bcrypt, suitable for high-volume systems
 * @param {string} otp - Plain OTP
 * @param {string} secret - Secret key for HMAC
 * @returns {string} HMAC hash
 */
export const hmacHash = (otp, secret) => {
  return crypto
    .createHmac('sha256', secret || process.env.JWT_SECRET)
    .update(otp)
    .digest('hex');
};

/**
 * Generate a secure random token for email verification links
 * @param {number} bytes - Number of random bytes (default: 32)
 * @returns {string} Random hex token
 */
export const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Calculate OTP expiry time
 * @param {number} minutes - Minutes until expiry (default: 10)
 * @returns {Date} Expiry timestamp
 */
export const getOtpExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
