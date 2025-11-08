const express = require('express');
const router = express.Router();
const { getProfileCompletion, getMe } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMe);
router.get('/profile-completion', protect, getProfileCompletion);

module.exports = router;
