const db = require('../config/db');

async function createOnboardingTables() {
  try {
    // Check if table already exists
    const tableExists = await db.schema.hasTable('onboarding_profiles');
    
    if (tableExists) {
      console.log('✅ onboarding_profiles table already exists');
      return;
    }
    
    // Create onboarding_profiles table
    await db.schema.createTable('onboarding_profiles', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('status').defaultTo('in_progress'); // in_progress, pending_approval, approved, rejected
      table.integer('current_step').defaultTo(1);
      
      // Step data (stored as JSON)
      table.text('step1_personal');
      table.text('step2_bank');
      table.text('step3_documents');
      table.text('step4_review');
      
      // Review data
      table.integer('reviewed_by').unsigned().references('id').inTable('users');
      table.timestamp('reviewed_at');
      table.text('rejection_notes');
      
      // Timestamps
      table.timestamp('submitted_at');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    
    console.log('✅ onboarding_profiles table created successfully');
  } catch (error) {
    console.error('❌ Error creating onboarding_profiles table:', error);
    throw error;
  }
}

// Run migration
createOnboardingTables()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
