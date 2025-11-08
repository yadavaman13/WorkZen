import db from '../config/database.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcryptjs';

/**
 * Get all users (HR only)
 */
export const getAllUsers = async (req, res) => {
  try {
    // Check authorization
    if (req.user.role !== 'admin' && req.user.role !== 'hr_officer') {
      return res.status(403).json({ error: 'Unauthorized to view users' });
    }

    const { page = 1, limit = 10, role, status } = req.query;
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    let countQuery = db('users');
    let dataQuery = db('users');

    if (role) {
      countQuery = countQuery.where('role', role);
      dataQuery = dataQuery.where('role', role);
    }

    if (status === 'active') {
      countQuery = countQuery.where('is_active', true);
      dataQuery = dataQuery.where('is_active', true);
    } else if (status === 'inactive') {
      countQuery = countQuery.where('is_active', false);
      dataQuery = dataQuery.where('is_active', false);
    }

    // Get total count
    const totalResult = await countQuery.count('* as count').first();
    const total = parseInt(totalResult.count);

    // Get paginated users
    const users = await dataQuery
      .select('id', 'email', 'full_name', 'role', 'is_active', 'created_at')
      .limit(parseInt(limit))
      .offset(offset)
      .orderBy('created_at', 'desc');

    res.json({
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });

    logger.info(`Retrieved ${users.length} users`);
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Authorization: Users can only view their own profile unless they're admin/HR
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin' && req.user.role !== 'hr_officer') {
      return res.status(403).json({ error: 'Unauthorized to view this user' });
    }

    const user = await db('users')
      .select('id', 'email', 'full_name', 'role', 'is_active', 'created_at')
      .where('id', id)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
    logger.info(`Retrieved user: ${id}`);
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create new user (HR only)
 */
export const createUser = async (req, res) => {
  try {
    // Check authorization
    if (req.user.role !== 'admin' && req.user.role !== 'hr_officer') {
      return res.status(403).json({ error: 'Unauthorized to create users' });
    }

    const { email, password, full_name, role = 'employee' } = req.body;

    // Validation
    if (!email || !password || !full_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, password, full_name' 
      });
    }

    // Validate role
    const validRoles = ['admin', 'hr_officer', 'manager', 'employee', 'contractor'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
      });
    }

    // HR officers cannot create admin users
    if (req.user.role === 'hr_officer' && role === 'admin') {
      return res.status(403).json({ error: 'HR officers cannot create admin users' });
    }

    // Check if email already exists
    const existingUser = await db('users').where('email', email).first();
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      email,
      password: hashedPassword,
      full_name,
      role,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [id] = await db('users').insert(userData);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id,
        email,
        full_name,
        role
      }
    });

    logger.info(`Created new user: ${email}`);
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update user details
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, is_active } = req.body;

    // Check if user exists first
    const targetUser = await db('users').where('id', id).first();
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent users from modifying themselves
    if (req.user.id === parseInt(id)) {
      return res.status(403).json({ error: 'Cannot modify your own account. Ask another admin or HR officer.' });
    }

    // Authorization check
    if (req.user.role !== 'admin' && req.user.role !== 'hr_officer') {
      return res.status(403).json({ error: 'Unauthorized to update users' });
    }

    const updateData = {};

    // HR officers cannot modify admin users
    if (req.user.role === 'hr_officer' && targetUser.role === 'admin') {
      return res.status(403).json({ error: 'HR officers cannot modify admin users' });
    }

    // HR officers cannot promote users to admin
    if (req.user.role === 'hr_officer' && role === 'admin') {
      return res.status(403).json({ error: 'HR officers cannot create or promote users to admin role' });
    }

    if (full_name) {
      updateData.full_name = full_name;
    }
    
    if (role) {
      const validRoles = ['admin', 'hr_officer', 'manager', 'employee', 'contractor'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
        });
      }
      updateData.role = role;
    }
    
    if (typeof is_active !== 'undefined') {
      updateData.is_active = is_active;
    }

    updateData.updated_at = new Date();

    await db('users').where('id', id).update(updateData);

    res.json({ message: 'User updated successfully' });
    logger.info(`Updated user: ${id}`);
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete user (soft delete - mark as inactive)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.role !== 'hr_officer') {
      return res.status(403).json({ error: 'Unauthorized to delete users' });
    }

    const user = await db('users').where('id', id).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await db('users')
        .where('role', 'admin')
        .where('is_active', true)
        .count('* as count')
        .first();

      if (adminCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    await db('users')
      .where('id', id)
      .update({ 
        is_active: false,
        updated_at: new Date()
      });

    res.json({ message: 'User deactivated successfully' });
    logger.info(`Deactivated user: ${id}`);
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all available roles
 */
export const getAllRoles = async (req, res) => {
  try {
    const roles = await db('roles').orderBy('name');

    res.json(roles);
    logger.info('Retrieved all roles');
  } catch (error) {
    logger.error('Error fetching roles:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (req, res) => {
  try {
    // Check authorization
    if (req.user.role !== 'admin' && req.user.role !== 'hr_officer') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const totalUsers = await db('users').count('* as count').first();
    const activeUsers = await db('users')
      .where('is_active', true)
      .count('* as count')
      .first();
    const byRole = await db('users')
      .select('role')
      .count('* as count')
      .groupBy('role');

    res.json({
      total: totalUsers.count,
      active: activeUsers.count,
      inactive: totalUsers.count - activeUsers.count,
      byRole
    });

    logger.info('Retrieved user statistics');
  } catch (error) {
    logger.error('Error fetching user statistics:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Reset user password (HR only, for user account management)
 */
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.role !== 'hr_officer') {
      return res.status(403).json({ error: 'Unauthorized to reset passwords' });
    }

    if (!new_password) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const user = await db('users').where('id', id).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await db('users')
      .where('id', id)
      .update({ 
        password: hashedPassword,
        updated_at: new Date()
      });

    res.json({ message: 'User password reset successfully' });
    logger.info(`Reset password for user: ${id}`);
  } catch (error) {
    logger.error('Error resetting password:', error);
    res.status(500).json({ error: error.message });
  }
};
