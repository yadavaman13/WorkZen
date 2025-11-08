/**
 * OTP Utility Functions
 * Handles OTP generation, hashing, and comparison for email verification
 * Uses bcrypt for secure OTP storage
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Generate a random numeric OTP
 * @param {number} digits - Number of digits (default: 6)
 * @returns {string} - Generated OTP
 */
const generateOtp = (digits = 6) => {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return String(Math.floor(Math.random() * (max - min + 1) + min));
};

/**
 * Hash OTP using bcrypt for secure storage
 * @param {string} otp - Plain OTP to hash
 * @returns {Promise<string>} - Hashed OTP
 */
const hashOtp = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

/**
 * Compare plain OTP with hashed OTP
 * @param {string} otp - Plain OTP from user input
 * @param {string} hash - Hashed OTP from database
 * @returns {Promise<boolean>} - True if match
 */
const compareOtp = async (otp, hash) => {
  return bcrypt.compare(otp, hash);
};

/**
 * Generate OTP expiry timestamp (default: 10 minutes from now)
 * @param {number} minutes - Minutes until expiry
 * @returns {Date} - Expiry timestamp
 */
const generateOtpExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Alternative: HMAC-SHA256 for OTP hashing (faster, constant-time comparison)
 * Use this if you need better performance than bcrypt
 * @param {string} otp - Plain OTP
 * @param {string} secret - Secret key from environment
 * @returns {string} - HMAC hash
 */
const hmacHash = (otp, secret) => {
  return crypto.createHmac('sha256', secret).update(otp).digest('hex');
};

module.exports = {
  generateOtp,
  hashOtp,
  compareOtp,
  generateOtpExpiry,
  hmacHash
};

