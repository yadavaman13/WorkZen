/**
 * Seed script for comprehensive leave management system
 * Initializes employee contracts, public holidays, and leave balances
 */

const knex = require('../config/db');

async function seedLeaveManagementData() {
  try {
    console.log('🌱 Starting comprehensive leave management seed...');

    // 1. Create employee contracts for all users
    console.log('\n📄 Creating employee contracts...');
    const users = await knex('users').select('id', 'role');
    
    const contracts = users.map(user => ({
      employee_id: user.id, // Changed from user.user_id to user.id
      monthly_salary: user.role === 'Admin' ? 100000 : 
                      user.role === 'HR' ? 80000 : 60000,
      contracted_monthly_hours: 160, // Standard 8 hours/day * 20 working days
      effective_from: new Date('2025-01-01'),
      effective_to: null,
      is_active: true
    }));

    await knex('employee_contracts').insert(contracts);
    console.log(`✅ Created ${contracts.length} employee contracts`);

    // 2. Insert public holidays for 2025
    console.log('\n🎉 Creating public holidays for 2025...');
    const holidays = [
      { date: '2025-01-01', name: 'New Year\'s Day', description: 'First day of the year', is_mandatory: true },
      { date: '2025-01-26', name: 'Republic Day', description: 'Indian Republic Day', is_mandatory: true },
      { date: '2025-03-14', name: 'Holi', description: 'Festival of Colors', is_mandatory: true },
      { date: '2025-04-10', name: 'Eid ul-Fitr', description: 'Islamic festival', is_mandatory: true },
      { date: '2025-04-18', name: 'Good Friday', description: 'Christian festival', is_mandatory: true },
      { date: '2025-08-15', name: 'Independence Day', description: 'Indian Independence Day', is_mandatory: true },
      { date: '2025-08-27', name: 'Janmashtami', description: 'Birth of Lord Krishna', is_mandatory: true },
      { date: '2025-10-02', name: 'Gandhi Jayanti', description: 'Birth of Mahatma Gandhi', is_mandatory: true },
      { date: '2025-10-22', name: 'Dussehra', description: 'Victory of good over evil', is_mandatory: true },
      { date: '2025-11-12', name: 'Diwali', description: 'Festival of Lights', is_mandatory: true },
      { date: '2025-11-13', name: 'Diwali (Day 2)', description: 'Festival of Lights', is_mandatory: true },
      { date: '2025-12-25', name: 'Christmas', description: 'Birth of Jesus Christ', is_mandatory: true }
    ];

    await knex('public_holidays').insert(holidays);
    console.log(`✅ Created ${holidays.length} public holidays`);

    // 3. Initialize leave balances for 2025
    console.log('\n💰 Creating leave balances for 2025...');
    const balances = users.map(user => ({
      employee_id: user.id, // Changed from user.user_id to user.id
      year: 2025,
      total_allocated_paid_days: 24,
      total_allocated_sick_days: 7,
      carried_forward_days: 0,
      used_paid_days: 0,
      used_sick_days: 0,
      used_unpaid_days: 0,
      pending_paid_days: 0,
      pending_sick_days: 0,
      available_paid_days: 24,
      available_sick_days: 7
    }));

    await knex('leave_balances').insert(balances);
    console.log(`✅ Created ${balances.length} leave balance records`);

    // 4. Create current payroll period (November 2025)
    console.log('\n📊 Creating current payroll period...');
    await knex('payroll_periods').insert({
      period_code: '2025-11',
      start_date: '2025-11-01',
      end_date: '2025-11-30',
      status: 'Open'
    });
    console.log('✅ Created November 2025 payroll period');

    // 5. Add some sample critical tasks for testing
    console.log('\n📋 Creating sample critical tasks...');
    const sampleTasks = [
      {
        employee_id: users[0].id, // Changed from user.user_id to user.id
        task_name: 'Q4 Financial Report',
        description: 'Complete quarterly financial report for board meeting',
        deadline: '2025-11-30',
        priority: 'Critical',
        is_critical: true,
        status: 'InProgress'
      },
      {
        employee_id: users[1] ? users[1].id : users[0].id, // Changed
        task_name: 'Client Presentation',
        description: 'Present project deliverables to key client',
        deadline: '2025-11-25',
        priority: 'High',
        is_critical: true,
        status: 'Pending'
      }
    ];

    await knex('critical_tasks').insert(sampleTasks);
    console.log(`✅ Created ${sampleTasks.length} sample critical tasks`);

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('Summary:');
    console.log(`- Employee contracts: ${contracts.length}`);
    console.log(`- Public holidays: ${holidays.length}`);
    console.log(`- Leave balances: ${balances.length}`);
    console.log(`- Payroll periods: 1`);
    console.log(`- Sample tasks: ${sampleTasks.length}`);

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    throw error;
  } finally {
    await knex.destroy();
  }
}

// Run the seed
seedLeaveManagementData()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
