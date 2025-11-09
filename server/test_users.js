const db = require('./src/config/db');

async function checkUsers() {
  try {
    const users = await db('users').select('*');
    console.log('Total users:', users.length);
    console.log('\nAll users:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}, Employee ID: ${user.employee_id}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUsers();
