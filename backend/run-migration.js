import db from './src/config/database.js';

async function runMigration() {
  try {
    console.log('Running migration: Add full_name to users table...');

    // Add full_name column
    try {
      await db.schema.table('users', (table) => {
        table.string('full_name', 255).defaultTo('');
      });
      console.log('✓ Added full_name column');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.log('ℹ full_name column already exists or skipping: ' + err.message);
      }
    }

    // Update existing admin user
    await db('users')
      .where({ email: 'admin@workzen.com' })
      .update({ full_name: 'Admin User' });

    console.log('✓ Updated admin user full_name');

    // Verify the migration
    const user = await db('users')
      .where({ email: 'admin@workzen.com' })
      .select('email', 'full_name', 'password')
      .first();

    console.log('✓ Migration completed successfully!');
    console.log('  User:', user);

    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
