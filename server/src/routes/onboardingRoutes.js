const express = require('express');
const router = express.Router();
const {
  createOnboardingProfile,
  updateStepData,
  submitForApproval,
  getOnboardingProfile,
  getPendingOnboardingProfiles,
  reviewOnboarding
} = require('../controllers/onboardingController');
const { protect } = require('../middleware/authMiddleware');

// Employee routes
router.post('/create', protect, createOnboardingProfile);
router.get('/profile', protect, getOnboardingProfile);
router.put('/update-step', protect, updateStepData);
router.post('/submit', protect, submitForApproval);

// HR routes
router.get('/pending', protect, getPendingOnboardingProfiles);
router.put('/review/:profileId', protect, reviewOnboarding);

module.exports = router;
