const db = require('../config/db');

async function seedPayrollData() {
  try {
    console.log('Starting payroll data seeding...');

    // 1. Create payroll periods
    console.log('Creating payroll periods...');
    const periods = await db('payroll_periods')
      .insert([
        {
          period_name: 'October 2024',
          start_date: '2024-10-01',
          end_date: '2024-10-31',
          status: 'paid'
        },
        {
          period_name: 'November 2024',
          start_date: '2024-11-01',
          end_date: '2024-11-30',
          status: 'paid'
        },
        {
          period_name: 'December 2024',
          start_date: '2024-12-01',
          end_date: '2024-12-31',
          status: 'finalized'
        },
        {
          period_name: 'January 2025',
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          status: 'draft'
        },
        {
          period_name: 'February 2025',
          start_date: '2025-02-01',
          end_date: '2025-02-28',
          status: 'draft'
        }
      ])
      .returning('*')
      .onConflict(['period_name'])
      .ignore();

    console.log(`Created ${periods.length} payroll periods`);

    // Get all periods
    const allPeriods = await db('payroll_periods')
      .select('*')
      .orderBy('start_date', 'desc');

    // Get all users (employees)
    const users = await db('users')
      .select('id', 'email', 'name', 'role')
      .whereIn('role', ['employee', 'hr', 'payroll']);

    console.log(`Found ${users.length} employees`);

    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }

    // 2. Create payroll runs for October, November, December 2024
    console.log('Creating payroll runs...');
    const payrollRuns = [];

    for (const period of allPeriods.slice(0, 3)) { // First 3 periods (Oct, Nov, Dec 2024)
      const existingRun = await db('payroll_runs')
        .where({ payroll_period_id: period.id })
        .first();

      if (!existingRun) {
        const [run] = await db('payroll_runs')
          .insert({
            payroll_period_id: period.id,
            status: 'finalized',
            created_by: users[0].id,
            month: parseInt(period.start_date.split('-')[1]),
            year: parseInt(period.start_date.split('-')[0])
          })
          .returning('*');

        payrollRuns.push(run);
        console.log(`Created payroll run for ${period.period_name}`);
      } else {
        payrollRuns.push(existingRun);
        console.log(`Payroll run already exists for ${period.period_name}`);
      }
    }

    // 3. Create payslips for each employee in each payrun
    console.log('Creating payslips...');
    let payslipCount = 0;

    for (const run of payrollRuns) {
      const period = allPeriods.find(p => p.id === run.payroll_period_id);

      for (const user of users) {
        // Check if payslip already exists
        const existingPayslip = await db('payslips')
          .where({
            payroll_run_id: run.id,
            employee_id: user.id
          })
          .first();

        if (existingPayslip) {
          console.log(`Payslip already exists for ${user.name} in ${period.period_name}`);
          continue;
        }

        // Generate salary components based on role
        const baseSalary = user.role === 'employee' ? 50000 : 
                          user.role === 'hr' ? 60000 : 70000;

        const components = [
          { component: 'Basic Salary', amount: baseSalary, rate: '100%' },
          { component: 'HRA', amount: baseSalary * 0.4, rate: '40%' },
          { component: 'Standard Allowance', amount: 1600, rate: 'Fixed' },
          { component: 'Performance Bonus', amount: 5000, rate: 'Fixed' },
          { component: 'Leave Travel Allowance', amount: 2400, rate: 'Fixed' },
          { component: 'Fixed Allowance', amount: 3000, rate: 'Fixed' }
        ];

        const deductions = [
          { component: 'PF Employee Contribution', amount: baseSalary * 0.12, rate: '12%' },
          { component: 'PF Employer Contribution', amount: baseSalary * 0.12, rate: '12%' },
          { component: 'Professional Tax', amount: 200, rate: 'Fixed' }
        ];

        const gross = components.reduce((sum, c) => sum + c.amount, 0);
        const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
        const net = gross - totalDeductions;

        // Random attendance data
        const totalDays = 30;
        const presentDays = Math.floor(Math.random() * 3) + 28; // 28-30 days
        const paidLeaveDays = Math.floor(Math.random() * 3); // 0-2 days

        await db('payslips').insert({
          payroll_run_id: run.id,
          employee_id: user.id,
          period_start: period.start_date,
          period_end: period.end_date,
          month: run.month,
          year: run.year,
          components: JSON.stringify(components),
          deductions: JSON.stringify(deductions),
          gross: gross,
          net: net,
          status: 'validated',
          worked_days: presentDays,
          paid_leaves: paidLeaveDays,
          attendance_data: JSON.stringify({
            totalDays: totalDays,
            presentDays: presentDays,
            paidLeaveDays: paidLeaveDays,
            absentDays: totalDays - presentDays - paidLeaveDays
          })
        });

        payslipCount++;
        console.log(`Created payslip for ${user.name} in ${period.period_name}`);
      }

      // Update payroll run totals
      const payslips = await db('payslips')
        .where({ payroll_run_id: run.id })
        .select('gross', 'net');

      const totalGross = payslips.reduce((sum, p) => sum + parseFloat(p.gross), 0);
      const totalNet = payslips.reduce((sum, p) => sum + parseFloat(p.net), 0);

      await db('payroll_runs')
        .where({ id: run.id })
        .update({
          total_gross: totalGross,
          total_net: totalNet,
          employee_count: payslips.length
        });

      console.log(`Updated totals for ${period.period_name}: Gross=${totalGross}, Net=${totalNet}`);
    }

    console.log('\n=== Seeding Complete ===');
    console.log(`Created ${periods.length} payroll periods`);
    console.log(`Created ${payrollRuns.length} payroll runs`);
    console.log(`Created ${payslipCount} payslips`);
    console.log('========================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding payroll data:', error);
    process.exit(1);
  }
}

seedPayrollData();
