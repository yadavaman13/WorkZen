const db = require('../config/db');

/**
 * Cleanup expired and used password reset tokens
 * Run this as a cron job (e.g., hourly) to keep the database clean
 */
async function cleanupExpiredTokens() {
  try {
    const now = new Date();
    
    // Delete tokens that are:
    // 1. Expired (expires_at < NOW)
    // 2. Used and older than 1 day (to keep audit trail for 24 hours)
    const result = await db('password_resets')
      .where(function() {
        this.where('expires_at', '<', now)
          .orWhere(function() {
            this.where('used', true)
              .andWhere('created_at', '<', new Date(now.getTime() - 24 * 60 * 60 * 1000));
          });
      })
      .del();

    if (result > 0) {
      console.log(`🧹 Cleaned up ${result} expired/used password reset token(s)`);
    }
    
    return result;
  } catch (err) {
    console.error('❌ Error in cleanupExpiredTokens:', err);
    throw err;
  }
}

/**
 * Get statistics about password_resets table
 * Useful for monitoring
 */
async function getTokenStats() {
  try {
    const stats = await db('password_resets')
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(*) FILTER (WHERE used = true) as used'),
        db.raw('COUNT(*) FILTER (WHERE used = false AND expires_at > NOW()) as active'),
        db.raw('COUNT(*) FILTER (WHERE expires_at < NOW()) as expired')
      )
      .first();

    return stats;
  } catch (err) {
    console.error('❌ Error in getTokenStats:', err);
    return null;
  }
}

module.exports = {
  cleanupExpiredTokens,
  getTokenStats,
};
