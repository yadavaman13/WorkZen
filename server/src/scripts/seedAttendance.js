const db = require('../config/db');

async function seedAttendanceData() {
  try {
    console.log('🌱 Seeding attendance data...');
    
    // Get all employees
    const employees = await db('users')
      .where({ role: 'employee', status: 'active' })
      .select('id', 'name', 'department');
    
    if (employees.length === 0) {
      console.log('⚠️  No employees found. Please create employees first.');
      return;
    }
    
    // Update employees with departments and job titles if not set
    for (const emp of employees) {
      if (!emp.department) {
        const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
        const randomDept = departments[Math.floor(Math.random() * departments.length)];
        
        const jobTitles = {
          'Engineering': ['Software Engineer', 'Senior Developer', 'DevOps Engineer', 'QA Engineer'],
          'Marketing': ['Marketing Manager', 'Content Writer', 'SEO Specialist', 'Brand Manager'],
          'Sales': ['Sales Executive', 'Account Manager', 'Business Development', 'Sales Manager'],
          'HR': ['HR Manager', 'Recruiter', 'HR Coordinator', 'Training Manager'],
          'Finance': ['Accountant', 'Financial Analyst', 'Finance Manager', 'Auditor'],
          'Operations': ['Operations Manager', 'Project Manager', 'Team Lead', 'Coordinator']
        };
        
        const deptTitles = jobTitles[randomDept];
        const randomTitle = deptTitles[Math.floor(Math.random() * deptTitles.length)];
        
        await db('users')
          .where({ id: emp.id })
          .update({
            department: randomDept,
            job_title: randomTitle
          });
        
        console.log(`✅ Updated ${emp.name}: ${randomTitle} in ${randomDept}`);
      }
    }
    
    // Generate attendance records for last 30 days
    const today = new Date();
    const daysToGenerate = 30;
    
    for (let i = 0; i < daysToGenerate; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }
      
      // Check if records already exist for this date
      const existingRecords = await db('attendance_records')
        .where('attendance_date', dateString)
        .count('* as count')
        .first();
      
      if (parseInt(existingRecords.count) > 0) {
        console.log(`⏩ Skipping ${dateString} - records already exist`);
        continue;
      }
      
      for (const emp of employees) {
        // 90% attendance rate
        if (Math.random() > 0.9) {
          // Mark as absent
          await db('attendance_records').insert({
            employee_id: emp.id,
            attendance_date: dateString,
            status: 'Absent'
          });
          continue;
        }
        
        // Generate check-in time (between 8:30 AM and 10:00 AM)
        const checkInHour = 8 + Math.random() * 1.5;
        const checkInMinutes = Math.floor((checkInHour % 1) * 60);
        const checkInTime = `${Math.floor(checkInHour).toString().padStart(2, '0')}:${checkInMinutes.toString().padStart(2, '0')}:00`;
        
        // Check if late (after 9:30 AM)
        const isLate = checkInHour > 9.5;
        const lateByMinutes = isLate ? Math.floor((checkInHour - 9.5) * 60) : 0;
        
        // Generate check-out time (8-9 hours after check-in)
        const workHours = 8 + Math.random();
        const checkOutHour = checkInHour + workHours;
        const checkOutMinutes = Math.floor((checkOutHour % 1) * 60);
        const checkOutTime = `${Math.floor(checkOutHour).toString().padStart(2, '0')}:${checkOutMinutes.toString().padStart(2, '0')}:00`;
        
        // Determine status
        let status = 'Present';
        if (workHours < 4) {
          status = 'HalfDay';
        }
        
        await db('attendance_records').insert({
          employee_id: emp.id,
          attendance_date: dateString,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          hours_worked: parseFloat(workHours.toFixed(2)),
          status: status,
          is_late: isLate,
          late_by_minutes: lateByMinutes
        });
      }
      
      console.log(`✅ Generated attendance for ${dateString} (${employees.length} employees)`);
    }
    
    console.log('🎉 Attendance data seeded successfully!');
    
    // Show stats
    const stats = await db('attendance_records')
      .select(
        db.raw('count(*) as total'),
        db.raw('count(*) filter (where status = ?) as present', ['Present']),
        db.raw('count(*) filter (where status = ?) as absent', ['Absent']),
        db.raw('count(*) filter (where status = ?) as half_day', ['HalfDay']),
        db.raw('count(*) filter (where is_late = true) as late')
      )
      .first();
    
    console.log('\n📊 Attendance Statistics:');
    console.log(`   Total Records: ${stats.total}`);
    console.log(`   Present: ${stats.present}`);
    console.log(`   Absent: ${stats.absent}`);
    console.log(`   Half Day: ${stats.half_day}`);
    console.log(`   Late Arrivals: ${stats.late}`);
    
  } catch (error) {
    console.error('❌ Error seeding attendance data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedAttendanceData()
    .then(() => {
      console.log('\n✅ Seed script completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Seed script failed:', err);
      process.exit(1);
    });
}

module.exports = { seedAttendanceData };
