const crypto = require('crypto');

/**
 * Generate a secure random token
 * @param {number} bytes - Number of random bytes (default: 32)
 * @returns {string} Hex string token (64 chars for 32 bytes)
 */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash a token using SHA-256 (optional extra security)
 * Use this if you want to store hashed tokens in DB
 * @param {string} token - Plain text token
 * @returns {string} Hashed token (64 chars)
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate token expiry timestamp
 * @param {number} minutes - Minutes until expiry (default: 15)
 * @returns {Date} Expiry timestamp
 */
function generateTokenExpiry(minutes = 15) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

module.exports = {
  generateToken,
  hashToken,
  generateTokenExpiry,
};
