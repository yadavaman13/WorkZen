import db from './src/config/database.js';
import { generateEmployeeId } from './src/utils/employeeIdGenerator.js';

async function testEmployeeIdGeneration() {
  try {
    console.log('Testing employee ID generation...\n');
    
    // Check if employee_id_sequences table exists
    const tableExists = await db.schema.hasTable('employee_id_sequences');
    console.log('employee_id_sequences table exists:', tableExists);
    
    if (!tableExists) {
      console.log('\n❌ Table does not exist! Creating it now...');
      await db.schema.createTable('employee_id_sequences', (table) => {
        table.increments('id').primary();
        table.string('company_code', 2).notNullable();
        table.integer('year').notNullable();
        table.integer('last_serial').defaultTo(0);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.unique(['company_code', 'year']);
      });
      console.log('✅ Table created successfully');
    }
    
    // Check employees table
    const employeesTableExists = await db.schema.hasTable('employees');
    console.log('employees table exists:', employeesTableExists);
    
    if (!employeesTableExists) {
      console.log('\n❌ Employees table does not exist!');
      process.exit(1);
    }
    
    // Try to generate an employee ID
    console.log('\nGenerating employee ID...');
    const employeeId = await generateEmployeeId();
    console.log('✅ Generated Employee ID:', employeeId);
    
    // Generate another one to test sequence
    const employeeId2 = await generateEmployeeId();
    console.log('✅ Generated Employee ID:', employeeId2);
    
    console.log('\n✅ Employee ID generation working correctly!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.destroy();
  }
}

testEmployeeIdGeneration();
