const db = require('../config/db');
const crypto = require('crypto');

// Create onboarding profile after employee sets password
async function createOnboardingProfile(req, res) {
  try {
    const userId = req.user.id;
    
    // Check if onboarding profile already exists
    const existingProfile = await db('onboarding_profiles')
      .where({ user_id: userId })
      .first();
    
    if (existingProfile) {
      return res.json({
        success: true,
        profile: existingProfile
      });
    }
    
    // Create new onboarding profile
    const [profile] = await db('onboarding_profiles')
      .insert({
        user_id: userId,
        status: 'in_progress',
        current_step: 1,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    return res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error creating onboarding profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create onboarding profile'
    });
  }
}

// Update step data
async function updateStepData(req, res) {
  try {
    const userId = req.user.id;
    const { step, data } = req.body;
    
    // Update the specific step data
    const columnMap = {
      1: 'step1_personal',
      2: 'step2_bank',
      3: 'step3_documents',
      4: 'step4_review'
    };
    
    const column = columnMap[step];
    if (!column) {
      return res.status(400).json({
        success: false,
        message: 'Invalid step number'
      });
    }
    
    await db('onboarding_profiles')
      .where({ user_id: userId })
      .update({
        [column]: JSON.stringify(data),
        current_step: step,
        updated_at: new Date()
      });
    
    const profile = await db('onboarding_profiles')
      .where({ user_id: userId })
      .first();
    
    return res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error updating step data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update step data'
    });
  }
}

// Submit for HR approval
async function submitForApproval(req, res) {
  try {
    const userId = req.user.id;
    
    await db('onboarding_profiles')
      .where({ user_id: userId })
      .update({
        status: 'pending_approval',
        submitted_at: new Date(),
        updated_at: new Date()
      });
    
    const profile = await db('onboarding_profiles')
      .where({ user_id: userId })
      .first();
    
    return res.json({
      success: true,
      message: 'Profile submitted for HR approval',
      profile
    });
  } catch (error) {
    console.error('Error submitting for approval:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit for approval'
    });
  }
}

// Get onboarding profile
async function getOnboardingProfile(req, res) {
  try {
    const userId = req.user.id;
    
    const profile = await db('onboarding_profiles')
      .where({ user_id: userId })
      .first();
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding profile not found'
      });
    }
    
    // Parse JSON fields
    if (profile.step1_personal) profile.step1_personal = JSON.parse(profile.step1_personal);
    if (profile.step2_bank) profile.step2_bank = JSON.parse(profile.step2_bank);
    if (profile.step3_documents) profile.step3_documents = JSON.parse(profile.step3_documents);
    if (profile.step4_review) profile.step4_review = JSON.parse(profile.step4_review);
    
    return res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error getting onboarding profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get onboarding profile'
    });
  }
}

// HR: Get all pending onboarding profiles
async function getPendingOnboardingProfiles(req, res) {
  try {
    const profiles = await db('onboarding_profiles')
      .join('users', 'onboarding_profiles.user_id', 'users.id')
      .where('onboarding_profiles.status', 'pending_approval')
      .select(
        'onboarding_profiles.*',
        'users.name',
        'users.email',
        'users.employee_id',
        'users.role'
      )
      .orderBy('onboarding_profiles.submitted_at', 'desc');
    
    // Parse JSON fields
    profiles.forEach(profile => {
      if (profile.step1_personal) profile.step1_personal = JSON.parse(profile.step1_personal);
      if (profile.step2_bank) profile.step2_bank = JSON.parse(profile.step2_bank);
      if (profile.step3_documents) profile.step3_documents = JSON.parse(profile.step3_documents);
      if (profile.step4_review) profile.step4_review = JSON.parse(profile.step4_review);
    });
    
    return res.json({
      success: true,
      profiles,
      count: profiles.length
    });
  } catch (error) {
    console.error('Error getting pending profiles:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get pending profiles'
    });
  }
}

// HR: Approve or reject onboarding
async function reviewOnboarding(req, res) {
  try {
    const { profileId } = req.params;
    const { action, notes } = req.body; // action: 'approve' or 'reject'
    
    const reviewedBy = req.user.id;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"'
      });
    }
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    await db('onboarding_profiles')
      .where({ id: profileId })
      .update({
        status: newStatus,
        reviewed_by: reviewedBy,
        reviewed_at: new Date(),
        rejection_notes: action === 'reject' ? notes : null,
        updated_at: new Date()
      });
    
    // If approved, update user's profile_completion
    if (action === 'approve') {
      const profile = await db('onboarding_profiles')
        .where({ id: profileId })
        .first();
      
      await db('users')
        .where({ id: profile.user_id })
        .update({
          profile_completion: 100,
          status: 'active'
        });
    }
    
    const updatedProfile = await db('onboarding_profiles')
      .join('users', 'onboarding_profiles.user_id', 'users.id')
      .where('onboarding_profiles.id', profileId)
      .select(
        'onboarding_profiles.*',
        'users.name',
        'users.email',
        'users.employee_id'
      )
      .first();
    
    return res.json({
      success: true,
      message: `Onboarding ${action}d successfully`,
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error reviewing onboarding:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to review onboarding'
    });
  }
}

module.exports = {
  createOnboardingProfile,
  updateStepData,
  submitForApproval,
  getOnboardingProfile,
  getPendingOnboardingProfiles,
  reviewOnboarding
};
