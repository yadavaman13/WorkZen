import express from 'express';
import * as onboardingController from '../controllers/onboardingController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// HR creates invite
router.post('/invite', 
  authenticate, 
  authorize('admin', 'hr_officer'), 
  onboardingController.createOnboardingInvite
);

// Candidate validates token (public)
router.get('/validate/:token', 
  onboardingController.validateToken
);

// Candidate saves personal info
router.put('/personal/:token', 
  onboardingController.savePersonalInfo
);

// Candidate saves bank info
router.put('/bank/:token', 
  onboardingController.saveBankInfo
);

// Candidate uploads documents
router.post('/upload/:token', 
  onboardingController.uploadDocuments
);

// OCR extraction
router.post('/ocr/extract/:doc_id', 
  authenticate, 
  onboardingController.extractOCR
);

// Candidate submits onboarding
router.post('/submit/:token', 
  onboardingController.submitOnboarding
);

// HR gets pending reviews
router.get('/reviews/pending', 
  authenticate, 
  authorize('admin', 'hr_officer'), 
  onboardingController.getPendingReviews
);

// HR approves onboarding
router.put('/approve/:onboarding_id', 
  authenticate, 
  authorize('admin', 'hr_officer'), 
  onboardingController.approveOnboarding
);

// HR requests changes
router.put('/request-changes/:onboarding_id', 
  authenticate, 
  authorize('admin', 'hr_officer'), 
  onboardingController.requestChanges
);

// HR rejects onboarding
router.put('/reject/:onboarding_id', 
  authenticate, 
  authorize('admin', 'hr_officer'), 
  onboardingController.rejectOnboarding
);

// Get onboarding details
router.get('/details/:token', 
  onboardingController.getOnboardingDetails
);

// Get onboarding statistics (HR only) - TODO: Implement getOnboardingStats
// router.get('/stats', 
//   authenticate, 
//   authorize('admin', 'hr_officer'), 
//   onboardingController.getOnboardingStats
// );

export default router;
