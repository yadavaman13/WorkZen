const db = require('./src/config/db');

async function checkUsersTable() {
  try {
    console.log('📋 Checking users table structure...\n');
    
    const result = await db.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in users table:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n📊 Checking existing users...');
    const users = await db('users').select('id', 'employee_id', 'email', 'name', 'role').limit(5);
    console.log('\nExisting users:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user.employee_id}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkUsersTable();
