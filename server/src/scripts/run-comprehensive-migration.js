/**
 * Run comprehensive leave management migration
 */

const knex = require('../config/db');
const migration = require('../migrations/004_comprehensive_leave_system');

async function runMigration() {
  try {
    console.log('🚀 Running comprehensive leave management migration...\n');

    // Run the migration (pass knex directly)
    await migration.up(knex);

    console.log('\n✅ Migration completed successfully!\n');
    console.log('Tables created:');
    console.log('  1. employee_contracts');
    console.log('  2. leave_requests');
    console.log('  3. leave_segments');
    console.log('  4. leave_balances');
    console.log('  5. leave_merge_queue');
    console.log('  6. payroll_adjustment_queue');
    console.log('  7. leave_audit_log');
    console.log('  8. public_holidays');
    console.log('  9. critical_tasks');
    console.log(' 10. payroll_periods');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await knex.destroy();
  }
}

runMigration();
