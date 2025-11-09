import pg from 'pg';

const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  database: 'workzen_hrms',
  user: 'postgres',
  password: '8511'
});

async function addPasswordResetFields() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Add reset_token column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
    `);
    console.log('✓ Password reset columns added');

    // Add index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token)
    `);
    console.log('✓ Index created');

    await client.end();
    console.log('✓ Done!');
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

addPasswordResetFields();
