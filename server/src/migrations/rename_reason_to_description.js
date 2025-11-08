/**
 * Migration to rename 'reason' column to 'description' in time_off_requests table
 * This ensures consistency with the frontend terminology
 */

const knex = require('../config/db');

async function renameReasonToDescription() {
  try {
    console.log('🔄 Checking if migration is needed...');
    
    // Check if the column 'reason' exists
    const hasReason = await knex.schema.hasColumn('time_off_requests', 'reason');
    const hasDescription = await knex.schema.hasColumn('time_off_requests', 'description');
    
    if (hasReason && !hasDescription) {
      console.log('📝 Renaming column "reason" to "description"...');
      await knex.schema.alterTable('time_off_requests', (table) => {
        table.renameColumn('reason', 'description');
      });
      console.log('✅ Column renamed successfully!');
    } else if (hasDescription) {
      console.log('✅ Column "description" already exists. No migration needed.');
    } else if (!hasReason && !hasDescription) {
      console.log('⚠️  Neither "reason" nor "description" column exists. Creating "description" column...');
      await knex.schema.alterTable('time_off_requests', (table) => {
        table.text('description').nullable();
      });
      console.log('✅ Column "description" created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Don't close the connection as it's the shared knex instance
    console.log('✅ Migration completed');
  }
}

// Run migration if called directly
if (require.main === module) {
  renameReasonToDescription()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { renameReasonToDescription };
