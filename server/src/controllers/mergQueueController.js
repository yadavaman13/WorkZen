/**
 * Leave Merge Queue Controller
 * Handles attendance reconciliation and missing attendance detection
 * Section 8: Attendance + Leave Merge rules
 */

const knex = require('../config/db');

/**
 * Get merge queue entries (HR view)
 */
exports.getMergeQueue = async (req, res) => {
  try {
    const { status, department, fromDate, toDate } = req.query;

    // Check if user is HR or Admin
    if (req.user.role !== 'Admin' && req.user.role !== 'HR') {
      return res.status(403).json({
        success: false,
        message: 'Only HR and Admin can view merge queue'
      });
    }

    let query = knex('leave_merge_queue as lmq')
      .join('users as u', 'lmq.employee_id', 'u.user_id')
      .leftJoin('departments as d', 'u.department_id', 'd.department_id')
      .select(
        'lmq.*',
        'u.first_name',
        'u.last_name',
        'u.email',
        'd.name as department_name'
      );

    if (status) {
      query = query.where('lmq.status', status);
    }

    if (department) {
      query = query.where('u.department_id', department);
    }

    if (fromDate) {
      query = query.where('lmq.date', '>=', fromDate);
    }

    if (toDate) {
      query = query.where('lmq.date', '<=', toDate);
    }

    const entries = await query.orderBy('lmq.date', 'desc');

    res.json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    console.error('Get merge queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch merge queue',
      error: error.message
    });
  }
};

/**
 * Get employee's own merge queue entries
 */
exports.getMyMergeQueueEntries = async (req, res) => {
  try {
    const employeeId = req.user.userId;

    const entries = await knex('leave_merge_queue')
      .where({ employee_id: employeeId, status: 'Pending' })
      .orderBy('date', 'desc');

    res.json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    console.error('Get my merge queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your merge queue entries',
      error: error.message
    });
  }
};

/**
 * Employee confirms missing attendance as leave (self-service)
 */
exports.confirmMergeQueueEntry = async (req, res) => {
  const trx = await knex.transaction();

  try {
    const { queueId } = req.params;
    const { leaveType = 'Paid', reason } = req.body;
    const employeeId = req.user.userId;

    const entry = await trx('leave_merge_queue')
      .where({ queue_id: queueId, employee_id: employeeId })
      .first();

    if (!entry) {
      await trx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Merge queue entry not found'
      });
    }

    if (entry.status !== 'Pending') {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        message: 'Entry already processed'
      });
    }

    // Create leave request for this date
    const leaveBalanceService = require('../services/leaveBalanceService');
    const year = new Date(entry.date).getFullYear();
    
    // Get balance
    const balance = await leaveBalanceService.getBalance(employeeId, year);
    
    // Determine if we have balance
    const hasBalance = leaveType === 'Paid' ? balance.available_paid_days >= 1 :
                       leaveType === 'Sick' ? balance.available_sick_days >= 1 : false;

    const actualLeaveType = hasBalance ? leaveType : 'Unpaid';

    // Get employee details
    const employee = await trx('users').where({ user_id: employeeId }).first();

    // Generate reference number
    const refYear = new Date().getFullYear();
    const count = await trx('leave_requests')
      .where('reference_number', 'like', `LR-${refYear}-%`)
      .count('request_id as count')
      .first();
    
    const nextNum = (parseInt(count.count) || 0) + 1;
    const referenceNumber = `LR-${refYear}-${String(nextNum).padStart(4, '0')}`;

    // Create leave request
    const [request] = await trx('leave_requests')
      .insert({
        reference_number: referenceNumber,
        employee_id: employeeId,
        department_id: employee.department_id,
        manager_id: null,
        status: 'Submitted',
        reason: reason || `Attendance merge for ${entry.date}`,
        notes: `Auto-created from attendance merge queue`,
        is_auto_split: false,
        version: 1,
        last_modified_by: employeeId
      })
      .returning('*');

    // Create segment
    const contract = await leaveBalanceService.getEmployeeContract(employeeId);
    const hourlyRate = leaveBalanceService.calculateHourlyRate(
      contract.monthly_salary,
      contract.contracted_monthly_hours
    );
    const durationHours = contract.contracted_monthly_hours / 22; // 1 day
    const deduction = actualLeaveType === 'Unpaid' ? hourlyRate * durationHours : 0;

    await trx('leave_segments').insert({
      request_id: request.request_id,
      segment_type: actualLeaveType,
      date_from: entry.date,
      date_to: entry.date,
      duration_type: 'FullDay',
      duration_hours: durationHours,
      duration_days: 1,
      status: 'Pending',
      hourly_rate: hourlyRate,
      payroll_deduction: deduction
    });

    // Update merge queue entry
    await trx('leave_merge_queue')
      .where({ queue_id: queueId })
      .update({
        status: 'Confirmed',
        processed_by: employeeId,
        processed_at: knex.fn.now(),
        created_request_id: request.request_id
      });

    // Create audit log
    await trx('leave_audit_log').insert({
      request_id: request.request_id,
      actor_id: employeeId,
      action: 'Created',
      comment: `Created from attendance merge queue - ${entry.date}`,
      metadata: JSON.stringify({ queueId, originalLeaveType: leaveType, actualLeaveType })
    });

    await trx.commit();

    // TODO: Notify HR

    res.json({
      success: true,
      message: 'Leave request created from merge queue entry',
      data: {
        requestId: request.request_id,
        referenceNumber: request.reference_number,
        leaveType: actualLeaveType,
        date: entry.date
      }
    });
  } catch (error) {
    await trx.rollback();
    console.error('Confirm merge queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm merge queue entry',
      error: error.message
    });
  }
};

/**
 * Employee ignores merge queue entry
 */
exports.ignoreMergeQueueEntry = async (req, res) => {
  try {
    const { queueId } = req.params;
    const employeeId = req.user.userId;

    const entry = await knex('leave_merge_queue')
      .where({ queue_id: queueId, employee_id: employeeId })
      .first();

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Merge queue entry not found'
      });
    }

    await knex('leave_merge_queue')
      .where({ queue_id: queueId })
      .update({
        status: 'Ignored',
        processed_by: employeeId,
        processed_at: knex.fn.now()
      });

    res.json({
      success: true,
      message: 'Merge queue entry ignored'
    });
  } catch (error) {
    console.error('Ignore merge queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ignore merge queue entry',
      error: error.message
    });
  }
};

/**
 * HR marks attendance as leave (quick action)
 */
exports.markAsLeave = async (req, res) => {
  const trx = await knex.transaction();

  try {
    const { queueId } = req.params;
    const { leaveType = 'Paid' } = req.body;
    const hrUserId = req.user.userId;

    // Check if user is HR or Admin
    if (req.user.role !== 'Admin' && req.user.role !== 'HR') {
      await trx.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only HR and Admin can mark as leave'
      });
    }

    const entry = await trx('leave_merge_queue')
      .where({ queue_id: queueId })
      .first();

    if (!entry) {
      await trx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Merge queue entry not found'
      });
    }

    // Similar logic to confirm but auto-approve
    const leaveBalanceService = require('../services/leaveBalanceService');
    const year = new Date(entry.date).getFullYear();
    const balance = await leaveBalanceService.getBalance(entry.employee_id, year);
    
    const hasBalance = leaveType === 'Paid' ? balance.available_paid_days >= 1 :
                       leaveType === 'Sick' ? balance.available_sick_days >= 1 : false;

    const actualLeaveType = hasBalance ? leaveType : 'Unpaid';

    // Get employee
    const employee = await trx('users').where({ user_id: entry.employee_id }).first();

    // Create request
    const refYear = new Date().getFullYear();
    const count = await trx('leave_requests')
      .where('reference_number', 'like', `LR-${refYear}-%`)
      .count('request_id as count')
      .first();
    
    const nextNum = (parseInt(count.count) || 0) + 1;
    const referenceNumber = `LR-${refYear}-${String(nextNum).padStart(4, '0')}`;

    const [request] = await trx('leave_requests')
      .insert({
        reference_number: referenceNumber,
        employee_id: entry.employee_id,
        department_id: employee.department_id,
        manager_id: null,
        status: 'Approved', // Auto-approved by HR
        reason: `HR marked attendance as leave - ${entry.date}`,
        notes: `Auto-approved by HR from merge queue`,
        approved_by: hrUserId,
        approved_at: knex.fn.now(),
        is_auto_split: false,
        version: 1,
        last_modified_by: hrUserId
      })
      .returning('*');

    // Create segment
    const contract = await leaveBalanceService.getEmployeeContract(entry.employee_id);
    const hourlyRate = leaveBalanceService.calculateHourlyRate(
      contract.monthly_salary,
      contract.contracted_monthly_hours
    );
    const durationHours = contract.contracted_monthly_hours / 22;
    const deduction = actualLeaveType === 'Unpaid' ? hourlyRate * durationHours : 0;

    const [segment] = await trx('leave_segments')
      .insert({
        request_id: request.request_id,
        segment_type: actualLeaveType,
        date_from: entry.date,
        date_to: entry.date,
        duration_type: 'FullDay',
        duration_hours: durationHours,
        duration_days: 1,
        status: 'Approved',
        approved_by: hrUserId,
        approved_at: knex.fn.now(),
        hourly_rate: hourlyRate,
        payroll_deduction: deduction
      })
      .returning('*');

    // Update balance
    await leaveBalanceService.updateBalanceOnApproval(
      entry.employee_id,
      [segment],
      year
    );

    // Update attendance
    await trx('attendance')
      .where({ employee_id: entry.employee_id, date: entry.date })
      .update({ status: 'Leave' });

    // Update merge queue
    await trx('leave_merge_queue')
      .where({ queue_id: queueId })
      .update({
        status: 'Processed',
        processed_by: hrUserId,
        processed_at: knex.fn.now(),
        created_request_id: request.request_id
      });

    // Audit log
    await trx('leave_audit_log').insert({
      request_id: request.request_id,
      segment_id: segment.segment_id,
      actor_id: hrUserId,
      action: 'Approved',
      comment: `HR marked as leave from merge queue - ${entry.date}`,
      metadata: JSON.stringify({ queueId, leaveType: actualLeaveType })
    });

    await trx.commit();

    res.json({
      success: true,
      message: 'Marked as leave and auto-approved',
      data: {
        requestId: request.request_id,
        referenceNumber: request.reference_number
      }
    });
  } catch (error) {
    await trx.rollback();
    console.error('Mark as leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as leave',
      error: error.message
    });
  }
};

/**
 * Daily cron job to detect missing attendance
 * Section 8: Attendance + Leave Merge rules
 */
exports.detectMissingAttendance = async () => {
  try {
    console.log('🔍 Running missing attendance detection...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Skip weekends
    const dayOfWeek = yesterday.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log('⏭️  Weekend - skipping');
      return;
    }

    // Check if it's a public holiday
    const isHoliday = await knex('public_holidays')
      .where({ date: yesterdayStr, is_mandatory: true })
      .first();

    if (isHoliday) {
      console.log('⏭️  Public holiday - skipping');
      return;
    }

    // Get all active employees
    const employees = await knex('users')
      .where({ is_active: true })
      .select('user_id');

    let entriesCreated = 0;

    for (const employee of employees) {
      // Check if attendance exists
      const attendance = await knex('attendance')
        .where({ employee_id: employee.user_id, date: yesterdayStr })
        .first();

      // Check if leave exists
      const leave = await knex('leave_segments as ls')
        .join('leave_requests as lr', 'ls.request_id', 'lr.request_id')
        .where('lr.employee_id', employee.user_id)
        .whereIn('ls.status', ['Approved', 'Pending'])
        .where('ls.date_from', '<=', yesterdayStr)
        .where('ls.date_to', '>=', yesterdayStr)
        .first();

      // Check if already in merge queue
      const existingQueue = await knex('leave_merge_queue')
        .where({ employee_id: employee.user_id, date: yesterdayStr })
        .first();

      // If no attendance AND no leave AND not in queue
      if (!attendance && !leave && !existingQueue) {
        await knex('leave_merge_queue').insert({
          employee_id: employee.user_id,
          date: yesterdayStr,
          reason_suggested: 'No attendance record found for this date',
          status: 'Pending',
          created_by_system: 1
        });

        entriesCreated++;

        // TODO: Send notification to employee
      } else if (attendance && attendance.status === 'Absent' && !leave && !existingQueue) {
        await knex('leave_merge_queue').insert({
          employee_id: employee.user_id,
          date: yesterdayStr,
          reason_suggested: 'Marked absent - would you like to mark as leave?',
          status: 'Pending',
          created_by_system: 1
        });

        entriesCreated++;

        // TODO: Send notification to employee
      }
    }

    console.log(`✅ Created ${entriesCreated} merge queue entries for ${yesterdayStr}`);

    // Auto-escalate old entries (7+ days old)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const escalated = await knex('leave_merge_queue')
      .where({ status: 'Pending', escalated: false })
      .where('created_at', '<', sevenDaysAgo.toISOString())
      .update({
        escalated: true,
        escalated_at: knex.fn.now()
      });

    if (escalated > 0) {
      console.log(`⚠️  Escalated ${escalated} old merge queue entries to HR`);
      // TODO: Send notification to HR
    }

    return { entriesCreated, escalated };
  } catch (error) {
    console.error('❌ Missing attendance detection error:', error);
    throw error;
  }
};

module.exports = exports;
