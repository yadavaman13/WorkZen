const knex = require('../config/db');
const bcrypt = require('bcryptjs');

async function createDemoUsers() {
  try {
    console.log('Creating demo users for all roles...\n');

    // Demo users data
    const demoUsers = [
      {
        employee_id: 'WZ-ADMIN-001',
        company_name: 'WorkZen Technologies',
        name: 'Admin User',
        email: 'admin@workzen.com',
        phone: '+1234567890',
        password: 'admin123',
        role: 'admin',
        status: 'active',
        profile_completion: 100,
      },
      {
        employee_id: 'WZ-HR-001',
        company_name: 'WorkZen Technologies',
        name: 'HR Officer',
        email: 'hr@workzen.com',
        phone: '+1234567891',
        password: 'hr123',
        role: 'hr',
        status: 'active',
        profile_completion: 100,
      },
      {
        employee_id: 'WZ-PAYROLL-001',
        company_name: 'WorkZen Technologies',
        name: 'Payroll Officer',
        email: 'payroll@workzen.com',
        phone: '+1234567892',
        password: 'payroll123',
        role: 'payroll',
        status: 'active',
        profile_completion: 100,
      },
      {
        employee_id: 'WZ-EMP-001',
        company_name: 'WorkZen Technologies',
        name: 'Employee User',
        email: 'employee@workzen.com',
        phone: '+1234567893',
        password: 'employee123',
        role: 'employee',
        status: 'active',
        profile_completion: 80,
      },
    ];

    // Check if users already exist and create them
    for (const user of demoUsers) {
      const existingUser = await knex('users')
        .where('email', user.email)
        .first();

      if (existingUser) {
        console.log(`❌ User already exists: ${user.email} (${user.role})`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Insert user
      await knex('users').insert({
        ...user,
        password: hashedPassword,
      });

      console.log(`✅ Created ${user.role.toUpperCase()} user:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Employee ID: ${user.employee_id}`);
      console.log('');
    }

    console.log('\n✨ Demo users creation completed!\n');
    console.log('='.repeat(50));
    console.log('LOGIN CREDENTIALS FOR ALL ROLES:');
    console.log('='.repeat(50));
    console.log('\n1. ADMIN:');
    console.log('   Email: admin@workzen.com');
    console.log('   Password: admin123');
    console.log('\n2. HR OFFICER:');
    console.log('   Email: hr@workzen.com');
    console.log('   Password: hr123');
    console.log('\n3. PAYROLL OFFICER:');
    console.log('   Email: payroll@workzen.com');
    console.log('   Password: payroll123');
    console.log('\n4. EMPLOYEE:');
    console.log('   Email: employee@workzen.com');
    console.log('   Password: employee123');
    console.log('\n' + '='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating demo users:', error);
    process.exit(1);
  }
}

// Run the script
createDemoUsers();
