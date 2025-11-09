const db = require('../config/db');

// Get user profile
async function getUserProfile(req, res) {
  try {
    const userId = req.user.id;

    // Get user basic info
    const user = await db('users')
      .select('id', 'employee_id', 'name', 'email', 'phone', 'company_name', 'role', 'created_at')
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Get user profile details
    let profile = await db('user_profiles')
      .where({ user_id: userId })
      .first();

    // If profile doesn't exist, create a default one
    if (!profile) {
      await db('user_profiles').insert({
        user_id: userId,
        skills: JSON.stringify([]),
        certifications: JSON.stringify([]),
        salary_components: JSON.stringify({}),
      });

      profile = await db('user_profiles')
        .where({ user_id: userId })
        .first();
    }

    // Parse JSON fields
    if (profile) {
      profile.skills = typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills || [];
      profile.certifications = typeof profile.certifications === 'string' ? JSON.parse(profile.certifications) : profile.certifications || [];
      profile.salary_components = typeof profile.salary_components === 'string' ? JSON.parse(profile.salary_components) : profile.salary_components || {};
    }

    return res.json({
      user,
      profile: profile || {},
    });
  } catch (err) {
    console.error('Get user profile error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

// Update user profile
async function updateUserProfile(req, res) {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    // Check if profile exists
    const existingProfile = await db('user_profiles')
      .where({ user_id: userId })
      .first();

    // Prepare data for update/insert
    const dataToSave = {
      user_id: userId,
      department: profileData.department,
      manager: profileData.manager,
      location: profileData.location,
      about: profileData.about,
      what_i_love: profileData.whatILove,
      interests: profileData.interests,
      skills: JSON.stringify(profileData.skills || []),
      certifications: JSON.stringify(profileData.certifications || []),
      date_of_birth: profileData.dateOfBirth,
      residing_address: profileData.residingAddress,
      nationality: profileData.nationality,
      personal_email: profileData.personalEmail,
      gender: profileData.gender,
      marital_status: profileData.maritalStatus,
      date_of_joining: profileData.dateOfJoining,
      account_number: profileData.accountNumber,
      bank_name: profileData.bankName,
      ifsc_code: profileData.ifscCode,
      pan_no: profileData.panNo,
      uan_no: profileData.uanNo,
      month_wage: profileData.monthWage,
      yearly_wage: profileData.yearlyWage,
      working_days_in_week: profileData.workingDaysInWeek,
      break_time: profileData.breakTime,
      salary_components: JSON.stringify(profileData.salaryComponents || {}),
      updated_at: db.fn.now(),
    };

    if (existingProfile) {
      // Update existing profile
      await db('user_profiles')
        .where({ user_id: userId })
        .update(dataToSave);
    } else {
      // Create new profile
      await db('user_profiles').insert(dataToSave);
    }

    // Get updated profile
    const updatedProfile = await db('user_profiles')
      .where({ user_id: userId })
      .first();

    // Parse JSON fields
    if (updatedProfile) {
      updatedProfile.skills = typeof updatedProfile.skills === 'string' ? JSON.parse(updatedProfile.skills) : updatedProfile.skills || [];
      updatedProfile.certifications = typeof updatedProfile.certifications === 'string' ? JSON.parse(updatedProfile.certifications) : updatedProfile.certifications || [];
      updatedProfile.salary_components = typeof updatedProfile.salary_components === 'string' ? JSON.parse(updatedProfile.salary_components) : updatedProfile.salary_components || {};
    }

    return res.json({
      msg: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (err) {
    console.error('Update user profile error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

// Update user basic info (name, phone)
async function updateUserBasicInfo(req, res) {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ msg: 'No data to update' });
    }

    await db('users')
      .where({ id: userId })
      .update(updateData);

    const updatedUser = await db('users')
      .select('id', 'employee_id', 'name', 'email', 'phone', 'company_name', 'role')
      .where({ id: userId })
      .first();

    return res.json({
      msg: 'User info updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Update user basic info error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateUserBasicInfo,
};
