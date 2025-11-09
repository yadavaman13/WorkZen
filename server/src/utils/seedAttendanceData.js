const db = require('../config/db');

async function seedAttendanceData() {
  try {
    console.log('🌱 Starting attendance data seeding...');

    // Get all active employees
    const employees = await db('users')
      .where('status', 'active')
      .whereNot('role', 'admin')
      .select('id', 'name');

    if (employees.length === 0) {
      console.log('⚠️  No employees found. Please create users first.');
      return;
    }

    console.log(`✅ Found ${employees.length} employees`);

    // Generate attendance for last 30 days
    const today = new Date();
    const attendanceRecords = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dateStr = date.toISOString().split('T')[0];

      for (const employee of employees) {
        // Random attendance pattern (90% present, 5% absent, 5% half day)
        const random = Math.random();
        let status = 'Present';
        let checkInTime = null;
        let checkOutTime = null;
        let hoursWorked = null;

        if (random > 0.95) {
          // Absent
          status = 'Absent';
        } else if (random > 0.90) {
          // Half Day (note: database expects 'HalfDay' not 'Half Day')
          status = 'HalfDay';
          checkInTime = '09:00:00';
          checkOutTime = '14:00:00';
          hoursWorked = 5.0;
        } else {
          // Present
          status = 'Present';
          
          // Random check-in time between 8:30 and 10:00
          const checkInHour = 8 + Math.floor(Math.random() * 2);
          const checkInMinute = Math.floor(Math.random() * 60);
          checkInTime = `${String(checkInHour).padStart(2, '0')}:${String(checkInMinute).padStart(2, '0')}:00`;
          
          // Check-out time between 17:30 and 19:30
          const checkOutHour = 17 + Math.floor(Math.random() * 2);
          const checkOutMinute = Math.floor(Math.random() * 60);
          checkOutTime = `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMinute).padStart(2, '0')}:00`;
          
          // Calculate hours
          const checkIn = new Date(`2000-01-01 ${checkInTime}`);
          const checkOut = new Date(`2000-01-01 ${checkOutTime}`);
          hoursWorked = ((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2);
        }

        attendanceRecords.push({
          employee_id: employee.id,
          date: dateStr,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          status,
          hours_worked: hoursWorked,
          notes: null,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    // Check if data already exists
    const existingCount = await db('attendance_records').count('* as count').first();
    
    if (parseInt(existingCount.count) > 0) {
      console.log('⚠️  Attendance records already exist. Skipping seed...');
      console.log(`   Existing records: ${existingCount.count}`);
      return;
    }

    // Insert records in batches
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
      const batch = attendanceRecords.slice(i, i + batchSize);
      await db('attendance_records').insert(batch);
      inserted += batch.length;
      console.log(`   Inserted ${inserted}/${attendanceRecords.length} records...`);
    }

    console.log('✅ Attendance data seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`- Total Records: ${attendanceRecords.length}`);
    console.log(`- Employees: ${employees.length}`);
    console.log(`- Date Range: Last 30 working days`);
    console.log(`- Status Distribution: ~90% Present, ~5% Absent, ~5% Half Day`);

  } catch (error) {
    console.error('❌ Error seeding attendance data:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  seedAttendanceData()
    .then(() => {
      console.log('✅ Seed script completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed script failed:', err);
      process.exit(1);
    });
}

module.exports = { seedAttendanceData };
