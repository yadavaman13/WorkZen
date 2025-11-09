import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/workzen_hrms'
});

async function addReviewColumns() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Add review_comments column
    console.log('Adding review_comments column...');
    await client.query(`
      ALTER TABLE onboarding_requests 
      ADD COLUMN IF NOT EXISTS review_comments TEXT
    `);
    console.log('✅ Added review_comments column');

    // Add fields_to_change column (JSON array)
    console.log('Adding fields_to_change column...');
    await client.query(`
      ALTER TABLE onboarding_requests 
      ADD COLUMN IF NOT EXISTS fields_to_change JSONB
    `);
    console.log('✅ Added fields_to_change column');

    // Add revised_by column
    console.log('Adding revised_by column...');
    await client.query(`
      ALTER TABLE onboarding_requests 
      ADD COLUMN IF NOT EXISTS revised_by INTEGER REFERENCES users(id)
    `);
    console.log('✅ Added revised_by column');

    // Add revision_requested_at column
    console.log('Adding revision_requested_at column...');
    await client.query(`
      ALTER TABLE onboarding_requests 
      ADD COLUMN IF NOT EXISTS revision_requested_at TIMESTAMP
    `);
    console.log('✅ Added revision_requested_at column');

    console.log('\n✅ All review-related columns added successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

addReviewColumns();
