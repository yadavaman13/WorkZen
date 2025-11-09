const db = require('../config/db');

async function createAttendanceTables() {
  try {
    // 1. Create attendance_records table
    const hasAttendance = await db.schema.hasTable('attendance_records');
    if (!hasAttendance) {
      await db.schema.createTable('attendance_records', (table) => {
        table.increments('id').primary();
        table.integer('employee_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.date('attendance_date').notNullable();
        table.time('check_in_time');
        table.time('check_out_time');
        table.decimal('hours_worked', 5, 2).defaultTo(0);
        table.enum('status', ['Present', 'Absent', 'HalfDay', 'Leave', 'Holiday']).defaultTo('Absent');
        table.boolean('is_late').defaultTo(false);
        table.integer('late_by_minutes').defaultTo(0);
        table.string('check_in_location');
        table.string('check_out_location');
        table.string('check_in_ip');
        table.string('check_out_ip');
        table.text('notes');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        
        // Indexes for better performance
        table.index(['employee_id', 'attendance_date']);
        table.index('attendance_date');
        table.index('status');
        
        // Unique constraint: one record per employee per day
        table.unique(['employee_id', 'attendance_date']);
      });
      console.log('✅ Created attendance_records table');
    }

    // 2. Create attendance_settings table
    const hasSettings = await db.schema.hasTable('attendance_settings');
    if (!hasSettings) {
      await db.schema.createTable('attendance_settings', (table) => {
        table.increments('id').primary();
        table.time('work_start_time').defaultTo('09:00:00');
        table.time('work_end_time').defaultTo('18:00:00');
        table.time('late_threshold').defaultTo('09:30:00'); // After this time is considered late
        table.integer('grace_period_minutes').defaultTo(15); // Grace period before marking late
        table.decimal('full_day_hours', 4, 2).defaultTo(8.0);
        table.decimal('half_day_hours', 4, 2).defaultTo(4.0);
        table.boolean('weekend_saturday').defaultTo(false);
        table.boolean('weekend_sunday').defaultTo(true);
        table.boolean('auto_checkout_enabled').defaultTo(false);
        table.time('auto_checkout_time').defaultTo('18:30:00');
        table.boolean('geolocation_required').defaultTo(false);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      
      // Insert default settings
      await db('attendance_settings').insert({
        work_start_time: '09:00:00',
        work_end_time: '18:00:00',
        late_threshold: '09:30:00',
        grace_period_minutes: 15,
        full_day_hours: 8.0,
        half_day_hours: 4.0,
        weekend_saturday: false,
        weekend_sunday: true
      });
      console.log('✅ Created attendance_settings table with defaults');
    }

    // 3. Create holidays table
    const hasHolidays = await db.schema.hasTable('holidays');
    if (!hasHolidays) {
      await db.schema.createTable('holidays', (table) => {
        table.increments('id').primary();
        table.string('name', 200).notNullable();
        table.date('holiday_date').notNullable();
        table.text('description');
        table.boolean('is_optional').defaultTo(false);
        table.string('type', 50); // national, regional, company
        table.timestamp('created_at').defaultTo(db.fn.now());
        
        table.index('holiday_date');
      });
      console.log('✅ Created holidays table');
    }

    // 4. Create shift_schedules table
    const hasShifts = await db.schema.hasTable('shift_schedules');
    if (!hasShifts) {
      await db.schema.createTable('shift_schedules', (table) => {
        table.increments('id').primary();
        table.string('shift_name', 100).notNullable();
        table.time('start_time').notNullable();
        table.time('end_time').notNullable();
        table.text('description');
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      
      // Insert default shifts
      await db('shift_schedules').insert([
        { shift_name: 'Morning Shift', start_time: '06:00:00', end_time: '14:00:00', description: 'Early morning shift' },
        { shift_name: 'Day Shift', start_time: '09:00:00', end_time: '18:00:00', description: 'Regular day shift' },
        { shift_name: 'Evening Shift', start_time: '14:00:00', end_time: '22:00:00', description: 'Evening shift' },
        { shift_name: 'Night Shift', start_time: '22:00:00', end_time: '06:00:00', description: 'Night shift' }
      ]);
      console.log('✅ Created shift_schedules table with default shifts');
    }

    // 5. Create employee_shifts table (assigns shifts to employees)
    const hasEmployeeShifts = await db.schema.hasTable('employee_shifts');
    if (!hasEmployeeShifts) {
      await db.schema.createTable('employee_shifts', (table) => {
        table.increments('id').primary();
        table.integer('employee_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('shift_id').unsigned().notNullable().references('id').inTable('shift_schedules').onDelete('CASCADE');
        table.date('effective_from').notNullable();
        table.date('effective_to');
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
        
        table.index(['employee_id', 'is_active']);
      });
      console.log('✅ Created employee_shifts table');
    }

    // 6. Create attendance_regularization table (for attendance corrections)
    const hasRegularization = await db.schema.hasTable('attendance_regularization');
    if (!hasRegularization) {
      await db.schema.createTable('attendance_regularization', (table) => {
        table.increments('id').primary();
        table.integer('employee_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('attendance_record_id').unsigned().references('id').inTable('attendance_records').onDelete('CASCADE');
        table.date('regularization_date').notNullable();
        table.time('requested_check_in');
        table.time('requested_check_out');
        table.text('reason').notNullable();
        table.enum('status', ['Pending', 'Approved', 'Rejected']).defaultTo('Pending');
        table.integer('approved_by').unsigned().references('id').inTable('users');
        table.text('approver_comments');
        table.timestamp('approved_at');
        table.timestamp('created_at').defaultTo(db.fn.now());
        
        table.index(['employee_id', 'status']);
        table.index('regularization_date');
      });
      console.log('✅ Created attendance_regularization table');
    }

    // 7. Add department column to users table if not exists (for attendance filtering)
    const hasDepartment = await db.schema.hasColumn('users', 'department');
    if (!hasDepartment) {
      await db.schema.table('users', (table) => {
        table.string('department', 100);
      });
      console.log('✅ Added department column to users table');
    }

    // 8. Add job_title column to users table if not exists
    const hasJobTitle = await db.schema.hasColumn('users', 'job_title');
    if (!hasJobTitle) {
      await db.schema.table('users', (table) => {
        table.string('job_title', 100);
      });
      console.log('✅ Added job_title column to users table');
    }

    console.log('✅ All attendance tables created successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error creating attendance tables:', error);
    throw error;
  }
}

module.exports = { createAttendanceTables };
