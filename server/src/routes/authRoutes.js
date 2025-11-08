const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, requestPasswordReset, resetPassword } = require('../controllers/authController');

// Rate limiter for password reset requests
// Prevents abuse by limiting requests per IP
const resetPasswordLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX) || 5, // 5 requests per window
  message: { msg: 'Too many password reset requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', register);
router.post('/login', login);
router.post('/request-reset', resetPasswordLimiter, requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;
