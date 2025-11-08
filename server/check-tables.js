const knex = require('./src/config/db');

async function checkAndFixTables() {
  try {
    console.log('🔍 Checking existing tables...\n');
    
    // Check leave_balances
    const hasBalance = await knex.schema.hasTable('leave_balances');
    if (hasBalance) {
      console.log('📋 leave_balances table exists');
      try {
        const columns = await knex('leave_balances').columnInfo();
        console.log('   Columns:', Object.keys(columns).join(', '));
        
        // Drop and recreate if columns don't match
        if (!columns.user_id) {
          console.log('⚠️  Incorrect schema detected. Dropping table...');
          await knex.schema.dropTable('leave_balances');
          console.log('✅ Table dropped');
        }
      } catch (error) {
        console.log('   Error checking columns:', error.message);
      }
    }
    
    // Check time_off_requests
    const hasTimeOff = await knex.schema.hasTable('time_off_requests');
    if (hasTimeOff) {
      console.log('📋 time_off_requests table exists');
      try {
        const columns = await knex('time_off_requests').columnInfo();
        console.log('   Columns:', Object.keys(columns).join(', '));
      } catch (error) {
        console.log('   Error checking columns:', error.message);
      }
    }
    
    await knex.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await knex.destroy();
    process.exit(1);
  }
}

checkAndFixTables();
