/**
 * Migration Runner for OTP Tables
 * Run this file with: node migrations/run_002_migration.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function runMigration() {
  try {
    console.log('🚀 Starting OTP tables migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '002_create_email_otps.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await db.raw(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - email_otps table created');
    console.log('   - Indexes created on email and expires_at');
    console.log('   - status column added to users table');
    console.log('   - Existing users set to active status');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
