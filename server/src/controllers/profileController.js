const db = require('../config/db');

// Get user profile
async function getUserProfile(req, res) {
  try {
    const userId = req.user.id;

    // Get user info from users table (all profile data is in users table)
    const user = await db('users')
      .select('*')
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    return res.json({
      user,
      profile: user, // Profile data is the same as user data
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

    // Prepare data for update (only update fields that exist in users table)
    const dataToSave = {};
    
    // Map frontend field names to database column names
    if (profileData.department) dataToSave.department_id = profileData.department;
    if (profileData.manager) dataToSave.manager_id = profileData.manager;
    if (profileData.dateOfJoining) dataToSave.joining_date = profileData.dateOfJoining;
    if (profileData.accountNumber) dataToSave.bank_account_number = profileData.accountNumber;
    if (profileData.bankName) dataToSave.bank_name = profileData.bankName;
    if (profileData.ifscCode) dataToSave.ifsc_code = profileData.ifscCode;
    if (profileData.monthWage !== undefined) dataToSave.basic_salary = profileData.monthWage;
    if (profileData.salaryStructure) dataToSave.salary_structure_id = profileData.salaryStructure;

    // Update users table
    if (Object.keys(dataToSave).length > 0) {
      await db('users')
        .where({ id: userId })
        .update(dataToSave);
    }

    // Get updated user
    const updatedUser = await db('users')
      .where({ id: userId })
      .first();

    return res.json({
      msg: 'Profile updated successfully',
      profile: updatedUser,
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
