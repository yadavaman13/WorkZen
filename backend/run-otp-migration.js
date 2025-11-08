import db from './src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running OTP verification migration...');
    
    const migrationPath = path.join(__dirname, '../database/migrations/007_add_email_otp_verification.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await db.raw(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Tables created/updated:');
    console.log('  - users (added email_verified, verification_token fields)');
    console.log('  - email_otps (new table for OTP storage)');
    console.log('  - audit_logs (new table for audit trail)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
