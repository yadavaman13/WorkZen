const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, requestPasswordReset, resetPassword, verifyOtp, resendOtp } = require('../controllers/authController');

// Rate limiter for password reset requests
// Prevents abuse by limiting requests per IP
const resetPasswordLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX) || 5, // 5 requests per window
  message: { msg: 'Too many password reset requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for OTP operations (registration and resend)
// Prevents spam and brute force attacks
const otpLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 3, // 3 requests per minute
  message: { msg: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration and login routes
router.post('/register', otpLimiter, register);
router.post('/login', login);

// OTP verification routes
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', otpLimiter, resendOtp);

// Password reset routes
router.post('/request-reset', resetPasswordLimiter, requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;

