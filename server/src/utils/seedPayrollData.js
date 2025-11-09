const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function seedPayrollData() {
  try {
    console.log('🌱 Starting payroll data seeding...');

    // 1. Create a default department
    const deptId = uuidv4();
    const existingDept = await db.raw(`
      SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1
    `);

    let departmentId = deptId;
    if (existingDept.rows && existingDept.rows.length > 0) {
      departmentId = existingDept.rows[0].id;
      console.log('✅ Department already exists');
    } else {
      await db.raw(`
        INSERT INTO departments (id, name, created_at, updated_at)
        VALUES (?, 'Engineering', NOW(), NOW())
      `, [deptId]);
      console.log('✅ Created default department: Engineering');
    }

    // 2. Create default salary structure
    const structureId = uuidv4();
    const existingStructure = await db.raw(`
      SELECT id FROM salary_structures WHERE name = 'Standard Salary Structure' LIMIT 1
    `);

    let salaryStructureId = structureId;
    if (existingStructure.rows && existingStructure.rows.length > 0) {
      salaryStructureId = existingStructure.rows[0].id;
      console.log('✅ Salary structure already exists');
    } else {
      await db.raw(`
        INSERT INTO salary_structures (
          id, name, basic_percentage, hra_percentage, 
          standard_allowance, performance_bonus_percentage, 
          lta_percentage, pf_employee_percentage, 
          pf_employer_percentage, professional_tax, 
          created_at, updated_at
        ) VALUES (
          ?, 'Standard Salary Structure', 50.00, 50.00, 
          4167.00, 8.33, 8.33, 12.00, 12.00, 200.00, 
          NOW(), NOW()
        )
      `, [structureId]);
      console.log('✅ Created default salary structure');
    }

    // 3. Update users with department and bank details (for active employees only)
    const users = await db('users')
      .where({ status: 'active' })
      .whereIn('role', ['employee', 'hr', 'payroll', 'admin']);

    for (const user of users) {
      // Check if user already has bank details
      const hasBank = user.bank_account_number;
      
      if (!hasBank) {
        await db.raw(`
          UPDATE users 
          SET department_id = ?, 
              bank_account_number = ?
          WHERE id = ?
        `, [departmentId, `BANK${String(user.id).padStart(10, '0')}`, user.id]);
      }
    }
    console.log(`✅ Updated ${users.length} users with department and bank details`);

    // 4. Create contracts for all active employees
    for (const user of users) {
      const existingContract = await db.raw(`
        SELECT id FROM contracts WHERE employee_id = ? AND end_date IS NULL LIMIT 1
      `, [user.id]);

      if (existingContract.rows && existingContract.rows.length > 0) {
        continue; // Skip if contract exists
      }

      const contractId = uuidv4();
      const monthlySalary = 50000.00; // Default salary

      await db.raw(`
        INSERT INTO contracts (
          id, employee_id, salary_structure_id, 
          monthly_salary, bank_account_number, 
          pf_employee_rate, pf_employer_rate, 
          professional_tax, start_date, 
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, 
          12.00, 12.00, 200.00, '2025-01-01', 
          NOW(), NOW()
        )
      `, [
        contractId, 
        user.id, 
        salaryStructureId, 
        monthlySalary, 
        `BANK${String(user.id).padStart(10, '0')}`
      ]);
    }
    console.log(`✅ Created contracts for ${users.length} employees`);

    // 5. Create attendance records for October 2025
    const periodStart = new Date('2025-10-01');
    const periodEnd = new Date('2025-10-31');
    
    for (const user of users) {
      // Check if attendance already exists
      const existingAttendance = await db.raw(`
        SELECT COUNT(*) as count FROM attendance 
        WHERE employee_id = ? AND date BETWEEN ? AND ?
      `, [user.id, '2025-10-01', '2025-10-31']);

      if (existingAttendance.rows[0].count > 0) {
        continue; // Skip if attendance exists
      }

      // Create attendance for working days (Mon-Fri) in October 2025
      const currentDate = new Date(periodStart);
      while (currentDate <= periodEnd) {
        const dayOfWeek = currentDate.getDay();
        
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const attendanceId = uuidv4();
          const dateStr = currentDate.toISOString().split('T')[0];
          
          await db.raw(`
            INSERT INTO attendance (
              id, employee_id, date, status, hours, created_at, updated_at
            ) VALUES (?, ?, ?, 'present', 8.00, NOW(), NOW())
          `, [attendanceId, user.id, dateStr]);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    console.log(`✅ Created attendance records for October 2025`);

    // 6. Create payroll period for October 2025
    const periodId = uuidv4();
    const existingPeriod = await db.raw(`
      SELECT id FROM payroll_periods 
      WHERE period_name = 'October 2025' LIMIT 1
    `);

    let payrollPeriodId = periodId;
    if (existingPeriod.rows && existingPeriod.rows.length > 0) {
      payrollPeriodId = existingPeriod.rows[0].id;
      console.log('✅ Payroll period already exists');
    } else {
      await db.raw(`
        INSERT INTO payroll_periods (
          id, period_name, start_date, end_date, status, total_employees, created_at, updated_at
        ) VALUES (?, 'October 2025', '2025-10-01', '2025-10-31', 'draft', ?, NOW(), NOW())
      `, [periodId, users.length]);
      console.log('✅ Created payroll period for October 2025');
    }

    console.log('✅ Payroll data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Department: Engineering`);
    console.log(`- Salary Structure: Standard (Basic 50%, HRA 50% of Basic, etc.)`);
    console.log(`- Employees: ${users.length} with contracts and bank details`);
    console.log(`- Attendance: October 2025 working days`);
    console.log(`- Payroll Period: October 2025 (Open)`);
    console.log('\n💡 Next steps:');
    console.log('1. Create a payroll run using the API: POST /api/payroll/payruns');
    console.log('2. Auto-compute payslips: POST /api/payroll/payruns/:payrunId/compute');

  } catch (error) {
    console.error('❌ Error seeding payroll data:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedPayrollData();
