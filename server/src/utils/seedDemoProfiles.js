const db = require('../config/db');

async function seedDemoProfileData() {
  try {
    console.log('🌱 Seeding demo profile data...\n');

    // Get all users
    const users = await db('users').select('*');

    const demoProfiles = [
      {
        user_id: users.find(u => u.email === 'admin@workzen.com')?.id,
        department: 'Administration',
        manager: 'CEO',
        location: 'San Francisco, CA',
        about: 'Experienced administrator with over 10 years in HRMS management. Passionate about streamlining HR processes and improving employee experience.',
        what_i_love: 'Building efficient systems, mentoring teams, and creating positive workplace cultures.',
        interests: 'Technology innovation, leadership development, and organizational psychology.',
        skills: JSON.stringify(['Leadership', 'Strategic Planning', 'HRMS', 'Team Management']),
        certifications: JSON.stringify(['SHRM-SCP', 'PMP', 'Six Sigma Black Belt']),
        date_of_birth: '1985-05-15',
        residing_address: '123 Admin Street, San Francisco, CA 94102',
        nationality: 'American',
        personal_email: 'admin.personal@gmail.com',
        gender: 'Male',
        marital_status: 'Married',
        date_of_joining: '2020-01-15',
        account_number: '1234567890',
        bank_name: 'Bank of America',
        ifsc_code: 'BOFA0001234',
        pan_no: 'ABCDE1234A',
        uan_no: '100000000001',
        month_wage: 100000,
        yearly_wage: 1200000,
        working_days_in_week: 5,
        break_time: 1,
        salary_components: JSON.stringify({
          earnings: [
            { name: 'Basic Salary', amount: 50000, percentage: 50 },
            { name: 'HRA', amount: 25000, percentage: 25 },
            { name: 'Special Allowance', amount: 20000, percentage: 20 },
            { name: 'Performance Bonus', amount: 5000, percentage: 5 },
          ],
          deductions: [
            { name: 'PF', amount: 6000, percentage: 6 },
            { name: 'Professional Tax', amount: 200 },
          ],
        }),
      },
      {
        user_id: users.find(u => u.email === 'hr@workzen.com')?.id,
        department: 'Human Resources',
        manager: 'Admin User',
        location: 'New York, NY',
        about: 'HR professional specializing in talent acquisition and employee relations. Dedicated to fostering inclusive workplace environments.',
        what_i_love: 'Connecting with people, resolving conflicts, and helping employees grow in their careers.',
        interests: 'Employee engagement, diversity & inclusion, and organizational behavior.',
        skills: JSON.stringify(['Recruitment', 'Employee Relations', 'Conflict Resolution', 'HR Policies']),
        certifications: JSON.stringify(['PHR', 'SHRM-CP', 'Certified Talent Acquisition Specialist']),
        date_of_birth: '1990-08-20',
        residing_address: '456 HR Avenue, New York, NY 10001',
        nationality: 'American',
        personal_email: 'hr.personal@gmail.com',
        gender: 'Female',
        marital_status: 'Single',
        date_of_joining: '2021-03-01',
        account_number: '2345678901',
        bank_name: 'Chase Bank',
        ifsc_code: 'CHAS0002345',
        pan_no: 'BCDEF2345B',
        uan_no: '200000000002',
        month_wage: 70000,
        yearly_wage: 840000,
        working_days_in_week: 5,
        break_time: 1,
        salary_components: JSON.stringify({
          earnings: [
            { name: 'Basic Salary', amount: 35000, percentage: 50 },
            { name: 'HRA', amount: 17500, percentage: 25 },
            { name: 'Special Allowance', amount: 14000, percentage: 20 },
            { name: 'Performance Bonus', amount: 3500, percentage: 5 },
          ],
          deductions: [
            { name: 'PF', amount: 4200, percentage: 6 },
            { name: 'Professional Tax', amount: 200 },
          ],
        }),
      },
      {
        user_id: users.find(u => u.email === 'payroll@workzen.com')?.id,
        department: 'Finance',
        manager: 'Admin User',
        location: 'Chicago, IL',
        about: 'Detail-oriented payroll specialist with expertise in compensation management and financial reporting.',
        what_i_love: 'Numbers, accuracy, and ensuring employees are compensated fairly and on time.',
        interests: 'Financial analytics, tax regulations, and process automation.',
        skills: JSON.stringify(['Payroll Processing', 'Tax Compliance', 'Financial Reporting', 'Excel']),
        certifications: JSON.stringify(['CPP (Certified Payroll Professional)', 'FPC', 'QuickBooks Certified']),
        date_of_birth: '1988-11-10',
        residing_address: '789 Finance Road, Chicago, IL 60601',
        nationality: 'American',
        personal_email: 'payroll.personal@gmail.com',
        gender: 'Male',
        marital_status: 'Married',
        date_of_joining: '2021-06-15',
        account_number: '3456789012',
        bank_name: 'Wells Fargo',
        ifsc_code: 'WFAR0003456',
        pan_no: 'CDEFG3456C',
        uan_no: '300000000003',
        month_wage: 75000,
        yearly_wage: 900000,
        working_days_in_week: 5,
        break_time: 1,
        salary_components: JSON.stringify({
          earnings: [
            { name: 'Basic Salary', amount: 37500, percentage: 50 },
            { name: 'HRA', amount: 18750, percentage: 25 },
            { name: 'Special Allowance', amount: 15000, percentage: 20 },
            { name: 'Performance Bonus', amount: 3750, percentage: 5 },
          ],
          deductions: [
            { name: 'PF', amount: 4500, percentage: 6 },
            { name: 'Professional Tax', amount: 200 },
          ],
        }),
      },
      {
        user_id: users.find(u => u.email === 'employee@workzen.com')?.id,
        department: 'Engineering',
        manager: 'Tech Lead',
        location: 'Austin, TX',
        about: 'Software developer with a passion for building scalable applications and learning new technologies.',
        what_i_love: 'Coding, problem-solving, and collaborating with talented teams.',
        interests: 'Open source, cloud computing, and AI/ML.',
        skills: JSON.stringify(['JavaScript', 'React', 'Node.js', 'Python', 'PostgreSQL']),
        certifications: JSON.stringify(['AWS Certified Developer', 'Google Cloud Professional']),
        date_of_birth: '1995-02-28',
        residing_address: '321 Developer Lane, Austin, TX 78701',
        nationality: 'American',
        personal_email: 'employee.personal@gmail.com',
        gender: 'Male',
        marital_status: 'Single',
        date_of_joining: '2022-01-10',
        account_number: '4567890123',
        bank_name: 'Citibank',
        ifsc_code: 'CITI0004567',
        pan_no: 'DEFGH4567D',
        uan_no: '400000000004',
        month_wage: 60000,
        yearly_wage: 720000,
        working_days_in_week: 5,
        break_time: 1,
        salary_components: JSON.stringify({
          earnings: [
            { name: 'Basic Salary', amount: 30000, percentage: 50 },
            { name: 'HRA', amount: 15000, percentage: 25 },
            { name: 'Special Allowance', amount: 12000, percentage: 20 },
            { name: 'Performance Bonus', amount: 3000, percentage: 5 },
          ],
          deductions: [
            { name: 'PF', amount: 3600, percentage: 6 },
            { name: 'Professional Tax', amount: 200 },
          ],
        }),
      },
    ];

    for (const profile of demoProfiles) {
      if (!profile.user_id) continue;

      const existing = await db('user_profiles').where({ user_id: profile.user_id }).first();

      if (existing) {
        console.log(`⏭️  Profile already exists for user ID: ${profile.user_id}`);
        continue;
      }

      await db('user_profiles').insert(profile);
      console.log(`✅ Created profile for user ID: ${profile.user_id}`);
    }

    console.log('\n✨ Demo profile data seeded successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding profile data:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDemoProfileData();
