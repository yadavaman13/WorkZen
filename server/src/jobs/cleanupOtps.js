/**
 * OTP Cleanup Job
 * Scheduled task to remove expired and used OTPs from database
 * Runs every hour to keep the email_otps table clean
 */

const db = require('../config/db');

/**
 * Delete expired and old used OTPs
 * - Removes OTPs expired more than 2 days ago
 * - Removes used OTPs older than 7 days
 */
const cleanupExpiredOtps = async () => {
  try {
    console.log('🧹 Running OTP cleanup job...');
    
    const result = await db('email_otps')
      .where('expires_at', '<', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))
      .orWhere(function() {
        this.where('used', true).where('created_at', '<', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      })
      .delete();
    
    if (result > 0) {
      console.log(`✅ Cleaned up ${result} expired/used OTP(s)`);
    } else {
      console.log('✅ No OTPs to clean up');
    }
    
    return result;
  } catch (error) {
    console.error('❌ OTP cleanup error:', error);
    throw error;
  }
};

/**
 * Get OTP statistics for monitoring
 * @returns {Promise<Object>} - Statistics about OTPs
 */
const getOtpStats = async () => {
  try {
    const total = await db('email_otps').count('* as count').first();
    const used = await db('email_otps').where('used', true).count('* as count').first();
    const active = await db('email_otps').where('used', false).where('expires_at', '>', new Date()).count('* as count').first();
    const expired = await db('email_otps').where('used', false).where('expires_at', '<', new Date()).count('* as count').first();
    
    return {
      total: parseInt(total.count),
      used: parseInt(used.count),
      active: parseInt(active.count),
      expired: parseInt(expired.count)
    };
  } catch (error) {
    console.error('❌ Error getting OTP stats:', error);
    return null;
  }
};

/**
 * Schedule cleanup job to run periodically
 * Call this from your main app.js file
 * @param {number} intervalMinutes - How often to run cleanup (default: 60 minutes)
 */
const scheduleOtpCleanup = (intervalMinutes = 60) => {
  // Run immediately on startup
  cleanupExpiredOtps()
    .then(() => console.log('✅ Initial OTP cleanup completed'))
    .catch(err => console.error('❌ Initial cleanup failed:', err));
  
  // Schedule recurring cleanup
  setInterval(async () => {
    console.log('🔄 Running scheduled OTP cleanup...');
    await cleanupExpiredOtps();
    
    // Log stats for monitoring
    const stats = await getOtpStats();
    if (stats) {
      console.log(`📊 OTP stats: ${stats.active} active, ${stats.used} used, ${stats.expired} expired`);
    }
  }, intervalMinutes * 60 * 1000);
  
  console.log(`⏰ OTP cleanup scheduled to run every ${intervalMinutes} minutes`);
};

module.exports = {
  cleanupExpiredOtps,
  getOtpStats,
  scheduleOtpCleanup
};

