const express = require('express');
const router = express.Router();
const profile = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// Get user profile (any authenticated user can get their own profile)
router.get('/', protect, profile.getUserProfile);

// Update user profile (any authenticated user can update their own profile)
router.put('/', protect, profile.updateUserProfile);

// Update basic user info (name, phone)
router.put('/basic', protect, profile.updateUserBasicInfo);

module.exports = router;
