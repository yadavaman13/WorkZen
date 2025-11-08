/**
 * Authentication Service
 * Handles all auth-related operations with database
 */

import db from '../config/database.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from './logger.js';

class AuthService {
  /**
   * Validate user credentials
   */
  async validateCredentials(email, password) {
    try {
      const user = await db('users')
        .where({ email })
        .select('id', 'email', 'password', 'full_name', 'role', 'is_active', 'created_at')
        .first();

      if (!user) {
        return {
          valid: false,
          error: 'Invalid email or password'
        };
      }

      if (!user.is_active) {
        return {
          valid: false,
          error: 'Account is deactivated. Please contact administrator.'
        };
      }

      const isPasswordValid = await bcryptjs.compare(password, user.password);

      if (!isPasswordValid) {
        return {
          valid: false,
          error: 'Invalid email or password'
        };
      }

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_active: user.is_active
        }
      };
    } catch (error) {
      logger.error('Error validating credentials:', error);
      return {
        valid: false,
        error: 'Authentication error'
      };
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
    try {
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET || 'default-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return token;
    } catch (error) {
      logger.error('Error generating token:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default-secret-key'
      );
      return decoded;
    } catch (error) {
      logger.error('Error verifying token:', error.message);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    try {
      const user = await db('users')
        .where({ id })
        .select('id', 'email', 'full_name', 'role', 'is_active', 'created_at')
        .first();

      return user || null;
    } catch (error) {
      logger.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    try {
      const user = await db('users')
        .where({ email })
        .select('id', 'email', 'full_name', 'role', 'is_active', 'created_at')
        .first();

      return user || null;
    } catch (error) {
      logger.error('Error getting user by email:', error);
      return null;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId, newPassword) {
    try {
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(newPassword, salt);

      await db('users')
        .where({ id: userId })
        .update({
          password: hashedPassword,
          updated_at: new Date()
        });

      logger.info(`Password updated for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error updating password:', error);
      return false;
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId) {
    try {
      await db('users')
        .where({ id: userId })
        .update({
          is_active: false,
          updated_at: new Date()
        });

      logger.info(`User deactivated: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error deactivating user:', error);
      return false;
    }
  }

  /**
   * Activate user account
   */
  async activateUser(userId) {
    try {
      await db('users')
        .where({ id: userId })
        .update({
          is_active: true,
          updated_at: new Date()
        });

      logger.info(`User activated: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error activating user:', error);
      return false;
    }
  }

  /**
   * Check if email already exists
   */
  async emailExists(email) {
    try {
      const user = await db('users')
        .where({ email })
        .first();

      return !!user;
    } catch (error) {
      logger.error('Error checking email:', error);
      return false;
    }
  }

  /**
   * Get user role permissions
   */
  async getUserPermissions(role) {
    try {
      const roleData = await db('roles')
        .where({ name: role })
        .first();

      return roleData || null;
    } catch (error) {
      logger.error('Error getting permissions:', error);
      return null;
    }
  }

  /**
   * Create session log
   */
  async logSession(userId, action = 'login') {
    try {
      // Optional: Create sessions/audit table for tracking
      logger.info(`Session ${action} for user: ${userId}`);
    } catch (error) {
      logger.error('Error logging session:', error);
    }
  }

  /**
   * Get user with role details
   */
  async getUserWithRole(userId) {
    try {
      const user = await db('users')
        .join('roles', 'users.role', 'roles.name')
        .where('users.id', userId)
        .select(
          'users.id',
          'users.email',
          'users.full_name',
          'users.role',
          'users.is_active',
          'roles.description',
          'users.created_at'
        )
        .first();

      return user || null;
    } catch (error) {
      logger.error('Error getting user with role:', error);
      return null;
    }
  }

  /**
   * Validate token and get user
   */
  async validateTokenAndGetUser(token) {
    try {
      const decoded = this.verifyToken(token);

      if (!decoded) {
        return null;
      }

      const user = await this.getUserById(decoded.id);

      if (!user || !user.is_active) {
        return null;
      }

      return user;
    } catch (error) {
      logger.error('Error validating token and getting user:', error);
      return null;
    }
  }
}

export default new AuthService();
