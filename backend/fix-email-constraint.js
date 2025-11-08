import db from './src/config/database.js';

async function fixEmailConstraint() {
  try {
    console.log('🔍 Checking for unique constraint on candidate_email...');
    
    // Check if constraint exists
    const constraints = await db.raw(`
      SELECT con.conname as constraint_name, 
             pg_get_constraintdef(con.oid) as constraint_def 
      FROM pg_constraint con 
      JOIN pg_class rel ON rel.oid = con.conrelid 
      WHERE rel.relname = 'onboarding_requests' 
      AND con.contype = 'u';
    `);
    
    console.log('Found constraints:', constraints.rows);
    
    // Look for candidate_email constraint
    const emailConstraint = constraints.rows.find(c => 
      c.constraint_def && c.constraint_def.includes('candidate_email')
    );
    
    if (emailConstraint) {
      console.log(`\n⚠️  Found constraint: ${emailConstraint.constraint_name}`);
      console.log(`   Definition: ${emailConstraint.constraint_def}`);
      
      // Drop the constraint
      console.log('\n🔧 Removing unique constraint on candidate_email...');
      await db.raw(`
        ALTER TABLE onboarding_requests 
        DROP CONSTRAINT IF EXISTS ${emailConstraint.constraint_name};
      `);
      
      console.log('✅ Constraint removed successfully!');
      console.log('\n📝 Note: Multiple candidates can now have the same email for different onboarding attempts.');
    } else {
      console.log('✅ No unique constraint found on candidate_email - all good!');
    }
    
    console.log('\n🎯 Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixEmailConstraint();
