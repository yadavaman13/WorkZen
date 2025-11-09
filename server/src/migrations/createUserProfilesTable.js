const db = require('../config/db');

// Create user_profiles table if it doesn't exist
async function createUserProfilesTable() {
  const hasTable = await db.schema.hasTable('user_profiles');
  
  if (!hasTable) {
    await db.schema.createTable('user_profiles', (t) => {
      t.increments('id').primary();
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').unique();
      
      // Basic Info
      t.string('department', 100);
      t.string('manager', 100);
      t.string('location', 100);
      
      // About Section
      t.text('about');
      t.text('what_i_love');
      t.text('interests');
      
      // Skills and Certifications (stored as JSON)
      t.json('skills').defaultTo('[]');
      t.json('certifications').defaultTo('[]');
      
      // Private Info
      t.date('date_of_birth');
      t.text('residing_address');
      t.string('nationality', 50);
      t.string('personal_email', 100);
      t.string('gender', 20);
      t.string('marital_status', 20);
      t.date('date_of_joining');
      
      // Bank Details
      t.string('account_number', 50);
      t.string('bank_name', 100);
      t.string('ifsc_code', 20);
      t.string('pan_no', 20);
      t.string('uan_no', 30);
      
      // Salary Info
      t.decimal('month_wage', 12, 2);
      t.decimal('yearly_wage', 12, 2);
      t.integer('working_days_in_week').defaultTo(5);
      t.decimal('break_time', 4, 2).defaultTo(1);
      
      // Salary Components (stored as JSON)
      t.json('salary_components').defaultTo('{}');
      
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.timestamp('updated_at').defaultTo(db.fn.now());
    });
    
    console.log('✅ user_profiles table created');
  } else {
    console.log('ℹ️  user_profiles table already exists');
  }
}

module.exports = { createUserProfilesTable };
