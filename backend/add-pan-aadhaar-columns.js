import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/workzen_hrms'
});

async function addColumns() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Check if columns exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'onboarding_requests' 
      AND column_name IN ('pan', 'aadhaar', 'pan_verified', 'aadhaar_verified')
    `;
    
    const result = await client.query(checkQuery);
    console.log('Existing columns:', result.rows.map(r => r.column_name));

    // Add columns if they don't exist
    if (!result.rows.find(r => r.column_name === 'pan')) {
      console.log('Adding pan column...');
      await client.query(`
        ALTER TABLE onboarding_requests 
        ADD COLUMN pan VARCHAR(255)
      `);
      console.log('✅ Added pan column');
    } else {
      console.log('pan column already exists');
    }

    if (!result.rows.find(r => r.column_name === 'aadhaar')) {
      console.log('Adding aadhaar column...');
      await client.query(`
        ALTER TABLE onboarding_requests 
        ADD COLUMN aadhaar VARCHAR(255)
      `);
      console.log('✅ Added aadhaar column');
    } else {
      console.log('aadhaar column already exists');
    }

    if (!result.rows.find(r => r.column_name === 'pan_verified')) {
      console.log('Adding pan_verified column...');
      await client.query(`
        ALTER TABLE onboarding_requests 
        ADD COLUMN pan_verified BOOLEAN DEFAULT false
      `);
      console.log('✅ Added pan_verified column');
    } else {
      console.log('pan_verified column already exists');
    }

    if (!result.rows.find(r => r.column_name === 'aadhaar_verified')) {
      console.log('Adding aadhaar_verified column...');
      await client.query(`
        ALTER TABLE onboarding_requests 
        ADD COLUMN aadhaar_verified BOOLEAN DEFAULT false
      `);
      console.log('✅ Added aadhaar_verified column');
    } else {
      console.log('aadhaar_verified column already exists');
    }

    // Verify columns were added
    const verifyResult = await client.query(checkQuery);
    console.log('\n✅ Final columns:', verifyResult.rows.map(r => r.column_name));
    console.log('\n✅ Database schema updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

addColumns();
