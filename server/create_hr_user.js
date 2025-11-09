const db = require('./src/config/db');
const bcrypt = require('bcrypt');

async function createHRUser() {
  try {
    console.log('🔧 Creating HR user...\n');

    // Check if HR user already exists
    const existingHR = await db('users')
      .where({ email: 'hr@workzen.io' })
      .orWhere({ role: 'hr' })
      .first();

    if (existingHR) {
      console.log('⚠️  HR user already exists:');
      console.log('   Email:', existingHR.email);
      console.log('   Role:', existingHR.role);
      console.log('   Employee ID:', existingHR.employee_id);
      console.log('\n✅ No need to create a new one');
      process.exit(0);
    }

    // Create HR user
    const hrPassword = 'hr123456'; // You can change this
    const hashedPassword = await bcrypt.hash(hrPassword, 10);

    const hrUser = {
      employee_id: 'HR0001',
      email: 'hr@workzen.io',
      name: 'HR Manager',
      password: hashedPassword,
      role: 'hr',
      phone: '1234567890',
      status: 'active',
      company_name: 'WorkZen',
      profile_completion: 100,
      created_at: new Date()
    };

    const [newUser] = await db('users').insert(hrUser).returning('*');

    console.log('✅ HR user created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('   Email:', newUser.email);
    console.log('   Password:', hrPassword);
    console.log('   Role:', newUser.role);
    console.log('   Employee ID:', newUser.employee_id);
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating HR user:', err);
    console.error('Error details:', err.message);
    process.exit(1);
  }
}

createHRUser();
