/**
 * Comprehensive Leave Management System Migration
 * 
 * Creates all necessary tables for the advanced leave management system:
 * - leave_requests: Main leave request with segments support
 * - leave_segments: Individual segments (Paid/Unpaid/SickPaid)
 * - leave_balances: Employee leave balance tracking
 * - leave_merge_queue: Attendance reconciliation queue
 * - payroll_adjustment_queue: Closed payroll adjustments
 * - leave_audit_log: Immutable audit trail
 * - employee_contracts: Store contracted hours and salary
 * - public_holidays: Holiday calendar
 * - critical_tasks: Tasks that affect workload risk
 */

exports.up = async function(knex) {
  // 1. Employee Contracts Table (for hourly rate calculations)
  await knex.schema.createTable('employee_contracts', (table) => {
    table.increments('contract_id').primary();
    table.integer('employee_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');
    table.decimal('monthly_salary', 12, 2).notNullable();
    table.decimal('contracted_monthly_hours', 6, 2).notNullable().defaultTo(160);
    table.date('effective_from').notNullable();
    table.date('effective_to').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
    
    table.index('employee_id');
    table.index(['employee_id', 'is_active']);
  });

  // 2. Leave Requests Table (main request entity)
  await knex.schema.createTable('leave_requests', (table) => {
    table.increments('request_id').primary();
    table.string('reference_number', 50).unique().notNullable(); // e.g., LR-2025-001
    table.integer('employee_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');
    table.integer('department_id').unsigned().nullable()
      .references('department_id').inTable('departments').onDelete('SET NULL');
    table.integer('manager_id').unsigned().nullable()
      .references('user_id').inTable('users').onDelete('SET NULL');
    
    // Request metadata
    table.timestamp('request_date').notNullable().defaultTo(knex.fn.now());
    table.enum('status', [
      'Draft',
      'Submitted',
      'Pending_Info',
      'Submitted_AutoSplit',
      'Needs_Override',
      'Approved',
      'Partially_Approved',
      'Rejected',
      'Cancelled'
    ]).notNullable().defaultTo('Draft');
    
    // Additional fields
    table.text('reason').nullable();
    table.text('notes').nullable();
    table.string('contact_info', 255).nullable();
    table.text('attachments').nullable(); // JSON array of file URLs
    
    // Auto-split tracking
    table.boolean('is_auto_split').notNullable().defaultTo(false);
    table.text('auto_split_details').nullable(); // JSON with split logic
    
    // Approver tracking
    table.integer('approved_by').unsigned().nullable()
      .references('user_id').inTable('users').onDelete('SET NULL');
    table.timestamp('approved_at').nullable();
    table.integer('rejected_by').unsigned().nullable()
      .references('user_id').inTable('users').onDelete('SET NULL');
    table.timestamp('rejected_at').nullable();
    table.text('rejection_reason').nullable();
    
    // Optimistic locking
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('last_modified').notNullable().defaultTo(knex.fn.now());
    table.integer('last_modified_by').unsigned().nullable()
      .references('user_id').inTable('users').onDelete('SET NULL');
    
    table.timestamps(true, true);
    
    table.index('employee_id');
    table.index('status');
    table.index('request_date');
    table.index('department_id');
    table.index(['employee_id', 'status']);
  });

  // 3. Leave Segments Table (Paid/Unpaid breakdown)
  await knex.schema.createTable('leave_segments', (table) => {
    table.increments('segment_id').primary();
    table.integer('request_id').unsigned().notNullable()
      .references('request_id').inTable('leave_requests').onDelete('CASCADE');
    
    // Segment details
    table.enum('segment_type', [
      'Paid',
      'Unpaid',
      'SickPaid',
      'SickUnpaid',
      'MaternityPaid',
      'PaternityPaid',
      'CompensatoryOff',
      'Other'
    ]).notNullable();
    
    table.date('date_from').notNullable();
    table.date('date_to').notNullable();
    
    table.enum('duration_type', [
      'FullDay',
      'HalfDay',
      'CustomHours'
    ]).notNullable().defaultTo('FullDay');
    
    table.decimal('duration_hours', 6, 2).notNullable();
    table.decimal('duration_days', 6, 2).notNullable();
    
    table.enum('status', [
      'Pending',
      'Approved',
      'Rejected',
      'Cancelled'
    ]).notNullable().defaultTo('Pending');
    
    // Payroll impact
    table.decimal('hourly_rate', 10, 2).nullable();
    table.decimal('payroll_deduction', 12, 2).notNullable().defaultTo(0);
    table.boolean('payroll_processed').notNullable().defaultTo(false);
    table.integer('payroll_period_id').unsigned().nullable();
    
    // Approver tracking
    table.integer('approved_by').unsigned().nullable()
      .references('user_id').inTable('users').onDelete('SET NULL');
    table.timestamp('approved_at').nullable();
    table.integer('rejected_by').unsigned().nullable()
      .references('user_id').inTable('users').onDelete('SET NULL');
    table.timestamp('rejected_at').nullable();
    table.text('rejection_reason').nullable();
    
    table.timestamps(true, true);
    
    table.index('request_id');
    table.index('status');
    table.index(['date_from', 'date_to']);
    table.index('segment_type');
  });

  // 4. Leave Balances Table (enhanced)
  await knex.schema.createTable('leave_balances', (table) => {
    table.increments('balance_id').primary();
    table.integer('employee_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');
    
    table.integer('year').notNullable();
    
    // Balance tracking
    table.decimal('total_allocated_paid_days', 6, 2).notNullable().defaultTo(24);
    table.decimal('total_allocated_sick_days', 6, 2).notNullable().defaultTo(7);
    table.decimal('carried_forward_days', 6, 2).notNullable().defaultTo(0);
    
    table.decimal('used_paid_days', 6, 2).notNullable().defaultTo(0);
    table.decimal('used_sick_days', 6, 2).notNullable().defaultTo(0);
    table.decimal('used_unpaid_days', 6, 2).notNullable().defaultTo(0);
    
    table.decimal('pending_paid_days', 6, 2).notNullable().defaultTo(0);
    table.decimal('pending_sick_days', 6, 2).notNullable().defaultTo(0);
    
    // Computed fields (updated via trigger or app logic)
    table.decimal('available_paid_days', 6, 2).notNullable().defaultTo(24);
    table.decimal('available_sick_days', 6, 2).notNullable().defaultTo(7);
    
    table.timestamp('last_updated').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    table.unique(['employee_id', 'year']);
    table.index('employee_id');
    table.index('year');
  });

  // 5. Leave Merge Queue (attendance reconciliation)
  await knex.schema.createTable('leave_merge_queue', (table) => {
    table.increments('queue_id').primary();
    table.integer('employee_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');
    
    table.date('date').notNullable();
    table.text('reason_suggested').nullable(); // System-generated reason
    
    table.enum('status', [
      'Pending',
      'Confirmed',
      'Ignored',
      'Processed'
    ]).notNullable().defaultTo('Pending');
    
    table.integer('created_by_system').notNullable().defaultTo(1); // System user ID
    table.integer('processed_by').unsigned().nullable()
      .references('user_id').inTable('users').onDelete('SET NULL');
    table.timestamp('processed_at').nullable();
    
    table.integer('created_request_id').unsigned().nullable()
      .references('request_id').inTable('leave_requests').onDelete('SET NULL');
    
    table.boolean('escalated').notNullable().defaultTo(false);
    table.timestamp('escalated_at').nullable();
    
    table.timestamps(true, true);
    
    table.index('employee_id');
    table.index('status');
    table.index('date');
    table.index(['employee_id', 'date']);
    table.index(['status', 'escalated']);
  });

  // 6. Payroll Adjustment Queue (closed payroll periods)
  await knex.schema.createTable('payroll_adjustment_queue', (table) => {
    table.increments('adjustment_id').primary();
    table.integer('employee_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');
    table.integer('leave_segment_id').unsigned().nullable()
      .references('segment_id').inTable('leave_segments').onDelete('SET NULL');
    
    table.string('period', 20).notNullable(); // e.g., "2025-11" for Nov 2025
    table.decimal('amount', 12, 2).notNullable(); // Deduction amount
    table.text('reason').notNullable();
    
    table.enum('status', [
      'Pending',
      'Processed',
      'Cancelled'
    ]).notNullable().defaultTo('Pending');
    
    table.integer('processed_by').unsigned().nullable()
      .references('user_id').inTable('users').onDelete('SET NULL');
    table.timestamp('processed_at').nullable();
    table.text('processing_notes').nullable();
    
    table.timestamps(true, true);
    
    table.index('employee_id');
    table.index('status');
    table.index('period');
    table.index(['employee_id', 'period']);
  });

  // 7. Leave Audit Log (immutable trail)
  await knex.schema.createTable('leave_audit_log', (table) => {
    table.increments('log_id').primary();
    table.integer('request_id').unsigned().nullable()
      .references('request_id').inTable('leave_requests').onDelete('CASCADE');
    table.integer('segment_id').unsigned().nullable()
      .references('segment_id').inTable('leave_segments').onDelete('CASCADE');
    
    table.integer('actor_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');
    table.enum('action', [
      'Created',
      'Submitted',
      'AutoSplit',
      'Approved',
      'Rejected',
      'PartiallyApproved',
      'Cancelled',
      'InfoRequested',
      'InfoProvided',
      'OverrideRequested',
      'OverrideApproved',
      'OverrideRejected',
      'BalanceAdjusted',
      'PayrollProcessed',
      'AttendanceUpdated',
      'Modified'
    ]).notNullable();
    
    table.text('comment').nullable();
    table.text('metadata').nullable(); // JSON with additional context
    table.string('ip_address', 45).nullable();
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
    
    table.index('request_id');
    table.index('actor_id');
    table.index('action');
    table.index('timestamp');
  });

  // 8. Public Holidays Table
  await knex.schema.createTable('public_holidays', (table) => {
    table.increments('holiday_id').primary();
    table.date('date').notNullable().unique();
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.boolean('is_mandatory').notNullable().defaultTo(true);
    table.string('country', 10).notNullable().defaultTo('IN');
    table.string('state', 50).nullable();
    table.timestamps(true, true);
    
    table.index('date');
    table.index(['date', 'is_mandatory']);
  });

  // 9. Critical Tasks Table (for workload risk)
  await knex.schema.createTable('critical_tasks', (table) => {
    table.increments('task_id').primary();
    table.integer('employee_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');
    table.integer('project_id').unsigned().nullable();
    
    table.string('task_name', 255).notNullable();
    table.text('description').nullable();
    table.date('deadline').notNullable();
    table.enum('priority', ['Low', 'Medium', 'High', 'Critical']).notNullable().defaultTo('Medium');
    table.boolean('is_critical').notNullable().defaultTo(false);
    
    table.enum('status', ['Pending', 'InProgress', 'Completed', 'Blocked']).notNullable().defaultTo('Pending');
    
    table.timestamps(true, true);
    
    table.index('employee_id');
    table.index('deadline');
    table.index(['employee_id', 'deadline', 'is_critical']);
  });

  // 10. Payroll Periods Table (for closed period tracking)
  await knex.schema.createTable('payroll_periods', (table) => {
    table.increments('period_id').primary();
    table.string('period_code', 20).notNullable().unique(); // e.g., "2025-11"
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.enum('status', ['Open', 'Processing', 'Closed', 'Archived']).notNullable().defaultTo('Open');
    table.integer('closed_by').unsigned().nullable()
      .references('user_id').inTable('users').onDelete('SET NULL');
    table.timestamp('closed_at').nullable();
    table.timestamps(true, true);
    
    table.index('period_code');
    table.index('status');
    table.index(['start_date', 'end_date']);
  });

  console.log('✅ Comprehensive leave management tables created successfully');
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('payroll_periods');
  await knex.schema.dropTableIfExists('critical_tasks');
  await knex.schema.dropTableIfExists('public_holidays');
  await knex.schema.dropTableIfExists('leave_audit_log');
  await knex.schema.dropTableIfExists('payroll_adjustment_queue');
  await knex.schema.dropTableIfExists('leave_merge_queue');
  await knex.schema.dropTableIfExists('leave_balances');
  await knex.schema.dropTableIfExists('leave_segments');
  await knex.schema.dropTableIfExists('leave_requests');
  await knex.schema.dropTableIfExists('employee_contracts');
  
  console.log('✅ Comprehensive leave management tables dropped successfully');
};
