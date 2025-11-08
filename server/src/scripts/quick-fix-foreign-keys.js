/**
 * Quick fix script to update database column references
 * Changes all user_id references to id to match existing users table
 */

const knex = require('../config/db');

async function quickFix() {
  try {
    console.log('🔧 Starting quick fix for database column references...\n');

    // 1. Update employee_contracts foreign key
    console.log('1. Updating employee_contracts...');
    await knex.schema.table('employee_contracts', (table) => {
      table.dropForeign('employee_id');
      table.foreign('employee_id').references('id').inTable('users').onDelete('CASCADE');
    });
    console.log('   ✅ employee_contracts updated');

    // 2. Update leave_requests foreign keys
    console.log('2. Updating leave_requests...');
    await knex.schema.table('leave_requests', (table) => {
      table.dropForeign('employee_id');
      table.dropForeign('manager_id');
      table.dropForeign('approved_by');
      table.dropForeign('rejected_by');
      table.dropForeign('last_modified_by');
      
      table.foreign('employee_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('manager_id').references('id').inTable('users').onDelete('SET NULL');
      table.foreign('approved_by').references('id').inTable('users').onDelete('SET NULL');
      table.foreign('rejected_by').references('id').inTable('users').onDelete('SET NULL');
      table.foreign('last_modified_by').references('id').inTable('users').onDelete('SET NULL');
    });
    console.log('   ✅ leave_requests updated');

    // 3. Update leave_segments foreign keys
    console.log('3. Updating leave_segments...');
    await knex.schema.table('leave_segments', (table) => {
      table.dropForeign('approved_by');
      table.dropForeign('rejected_by');
      
      table.foreign('approved_by').references('id').inTable('users').onDelete('SET NULL');
      table.foreign('rejected_by').references('id').inTable('users').onDelete('SET NULL');
    });
    console.log('   ✅ leave_segments updated');

    // 4. Update leave_balances foreign key
    console.log('4. Updating leave_balances...');
    await knex.schema.table('leave_balances', (table) => {
      table.dropForeign('employee_id');
      table.foreign('employee_id').references('id').inTable('users').onDelete('CASCADE');
    });
    console.log('   ✅ leave_balances updated');

    // 5. Update leave_merge_queue foreign keys
    console.log('5. Updating leave_merge_queue...');
    await knex.schema.table('leave_merge_queue', (table) => {
      table.dropForeign('employee_id');
      table.dropForeign('processed_by');
      
      table.foreign('employee_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('processed_by').references('id').inTable('users').onDelete('SET NULL');
    });
    console.log('   ✅ leave_merge_queue updated');

    // 6. Update payroll_adjustment_queue foreign keys
    console.log('6. Updating payroll_adjustment_queue...');
    await knex.schema.table('payroll_adjustment_queue', (table) => {
      table.dropForeign('employee_id');
      table.dropForeign('processed_by');
      
      table.foreign('employee_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('processed_by').references('id').inTable('users').onDelete('SET NULL');
    });
    console.log('   ✅ payroll_adjustment_queue updated');

    // 7. Update leave_audit_log foreign key
    console.log('7. Updating leave_audit_log...');
    await knex.schema.table('leave_audit_log', (table) => {
      table.dropForeign('actor_id');
      table.foreign('actor_id').references('id').inTable('users').onDelete('CASCADE');
    });
    console.log('   ✅ leave_audit_log updated');

    // 8. Update critical_tasks foreign key
    console.log('8. Updating critical_tasks...');
    await knex.schema.table('critical_tasks', (table) => {
      table.dropForeign('employee_id');
      table.foreign('employee_id').references('id').inTable('users').onDelete('CASCADE');
    });
    console.log('   ✅ critical_tasks updated');

    // 9. Update payroll_periods foreign key
    console.log('9. Updating payroll_periods...');
    await knex.schema.table('payroll_periods', (table) => {
      table.dropForeign('closed_by');
      table.foreign('closed_by').references('id').inTable('users').onDelete('SET NULL');
    });
    console.log('   ✅ payroll_periods updated');

    console.log('\n✅ All foreign keys updated successfully!');
    console.log('\n📝 Note: Code references still need to be updated.');
    console.log('   All .js files use req.user.userId which should map to users.id');
    console.log('   The authMiddleware likely sets userId from JWT token id field');

  } catch (error) {
    console.error('\n❌ Quick fix failed:', error.message);
    console.error(error);
  } finally {
    await knex.destroy();
  }
}

quickFix();
