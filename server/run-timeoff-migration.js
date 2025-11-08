const knex = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Running time_off_requests migration...');
    console.log('📍 Database:', process.env.DB_NAME || 'workzen');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '003_create_time_off_requests.sql'),
      'utf8'
    );

    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          await knex.raw(statement);
        } catch (error) {
          // Ignore errors for already existing objects
          if (error.code === '42P07' || error.code === '42710') {
            console.log(`⚠️  Object already exists, skipping...`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Tables created: time_off_requests, leave_balances');
    
    // Check if tables exist
    const hasTimeOff = await knex.schema.hasTable('time_off_requests');
    const hasBalance = await knex.schema.hasTable('leave_balances');
    
    console.log('📋 time_off_requests table exists:', hasTimeOff);
    console.log('📋 leave_balances table exists:', hasBalance);

    if (hasTimeOff && hasBalance) {
      console.log('✅ All tables created successfully!');
      
      // Check table structure
      const timeOffColumns = await knex('time_off_requests').columnInfo();
      console.log('📋 time_off_requests columns:', Object.keys(timeOffColumns).join(', '));
      
      const balanceColumns = await knex('leave_balances').columnInfo();
      console.log('📋 leave_balances columns:', Object.keys(balanceColumns).join(', '));
    }
    
    await knex.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error code:', error.code);
    await knex.destroy();
    process.exit(1);
  }
}

runMigration();
