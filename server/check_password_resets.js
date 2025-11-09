const db = require('./src/config/db');

(async () => {
  try {
    console.log('Checking password_resets table structure...\n');
    
    const result = await db.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'password_resets' 
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in password_resets table:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    console.log('\nChecking for "used" column...');
    const hasUsedColumn = result.rows.some(col => col.column_name === 'used');
    console.log(`Has "used" column: ${hasUsedColumn}`);
    
    if (!hasUsedColumn) {
      console.log('\n⚠️  Missing "used" column - this is causing the reset password error!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
