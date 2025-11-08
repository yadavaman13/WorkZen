import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/workzen_hrms'
});

async function checkEmployeesTable() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'employees'
      ORDER BY ordinal_position
    `);

    console.log('Current employees table structure:');
    console.log('='.repeat(80));
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(25)} | ${row.data_type.padEnd(20)} | Nullable: ${row.is_nullable}`);
    });
    console.log('='.repeat(80));
    console.log(`\nTotal columns: ${result.rows.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkEmployeesTable();
