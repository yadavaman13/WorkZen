/**
 * Comprehensive Leave Request Controller
 * Handles submission, approval, rejection with auto-split and all validations
 * Implements sections 5, 6, 7 of specification
 */

const knex = require('../config/db');
const leaveBalanceService = require('../services/leaveBalanceService');
const leaveImpactService = require('../services/leaveImpactService');

/**
 * Generate unique reference number for leave request
 */
const generateReferenceNumber = async () => {
  const year = new Date().getFullYear();
  const count = await knex('leave_requests')
    .where('reference_number', 'like', `LR-${year}-%`)
    .count('request_id as count')
    .first();
  
  const nextNum = (parseInt(count.count) || 0) + 1;
  return `LR-${year}-${String(nextNum).padStart(4, '0')}`;
};

/**
 * Create audit log entry
 */
const createAuditLog = async (requestId, segmentId, actorId, action, comment = null, metadata = null, ip = null) => {
  await knex('leave_audit_log').insert({
    request_id: requestId,
    segment_id: segmentId,
    actor_id: actorId,
    action,
    comment,
    metadata: metadata ? JSON.stringify(metadata) : null,
    ip_address: ip
  });
};

/**
 * Calculate leave request with auto-split analysis
 * Section 5: Submission flow - analyze before submit
 */
exports.calculateLeaveRequest = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, durationType, customHours } = req.body;
    const employeeId = req.user.userId;
    const year = new Date(fromDate).getFullYear();

    // Get auto-split analysis
    const splitAnalysis = await leaveBalanceService.calculateAutoSplit(
      employeeId,
      leaveType,
      fromDate,
      toDate,
      durationType,
      year
    );

    // Get current balance
    const balance = await leaveBalanceService.getBalance(employeeId, year);

    // Get contract for hourly rate
    const contract = await leaveBalanceService.getEmployeeContract(employeeId);

    res.json({
      success: true,
      data: {
        balance: {
          availablePaid: balance.available_paid_days,
          availableSick: balance.available_sick_days,
          usedPaid: balance.used_paid_days,
          usedSick: balance.used_sick_days,
          pendingPaid: balance.pending_paid_days,
          pendingSick: balance.pending_sick_days
        },
        splitAnalysis,
        contract: {
          monthlySalary: contract.monthly_salary,
          hourlyRate: leaveBalanceService.calculateHourlyRate(
            contract.monthly_salary,
            contract.contracted_monthly_hours
          )
        }
      }
    });
  } catch (error) {
    console.error('Calculate leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate leave request',
      error: error.message
    });
  }
};

/**
 * Submit leave request with auto-split handling
 * Section 5: Submission flow (employee side)
 */
exports.submitLeaveRequest = async (req, res) => {
  const trx = await knex.transaction();

  try {
    const {
      leaveType,
      fromDate,
      toDate,
      durationType,
      customHours,
      reason,
      contactInfo,
      attachments,
      splitOption // 'proceed', 'convert-unpaid', 'reduce', 'override'
    } = req.body;

    const employeeId = req.user.userId;
    const year = new Date(fromDate).getFullYear();
    const ip = req.ip || req.connection.remoteAddress;

    // Get employee details
    const employee = await trx('users')
      .where({ user_id: employeeId })
      .first();

    // Get auto-split analysis
    const splitAnalysis = await leaveBalanceService.calculateAutoSplit(
      employeeId,
      leaveType,
      fromDate,
      toDate,
      durationType,
      year
    );

    let segments = splitAnalysis.segments;
    let status = 'Submitted';
    let isAutoSplit = splitAnalysis.needsSplit;

    // Handle employee's choice if auto-split needed
    if (splitAnalysis.needsSplit) {
      switch (splitOption) {
        case 'convert-unpaid':
          // Convert entire request to unpaid
          segments = [{
            type: 'Unpaid',
            days: splitAnalysis.requestedPaidDays,
            hours: splitAnalysis.segments.reduce((sum, s) => sum + s.hours, 0),
            from: fromDate,
            to: toDate,
            deduction: splitAnalysis.segments.reduce((sum, s) => sum + s.deduction, 0)
          }];
          isAutoSplit = false;
          status = 'Submitted';
          break;

        case 'reduce':
          // Reduce to available paid days only
          segments = [splitAnalysis.segments[0]]; // Only paid segment
          isAutoSplit = false;
          status = 'Submitted';
          break;

        case 'override':
          // Request manager override
          status = 'Needs_Override';
          // Keep original segments for manager review
          break;

        case 'proceed':
        default:
          // Proceed with auto-split (default)
          status = 'Submitted_AutoSplit';
          break;
      }
    }

    // Generate reference number
    const referenceNumber = await generateReferenceNumber();

    // Create leave request
    const [request] = await trx('leave_requests')
      .insert({
        reference_number: referenceNumber,
        employee_id: employeeId,
        department_id: employee.department_id,
        manager_id: employee.department_id ? 
          (await trx('users')
            .where({ department_id: employee.department_id, role: 'Admin' })
            .orWhere({ department_id: employee.department_id, role: 'HR' })
            .first())?.user_id : null,
        status,
        reason,
        notes: null,
        contact_info: contactInfo,
        attachments: attachments ? JSON.stringify(attachments) : null,
        is_auto_split: isAutoSplit,
        auto_split_details: isAutoSplit ? JSON.stringify(splitAnalysis) : null,
        version: 1,
        last_modified_by: employeeId
      })
      .returning('*');

    // Get contract for payroll calculations
    const contract = await leaveBalanceService.getEmployeeContract(employeeId);
    const hourlyRate = leaveBalanceService.calculateHourlyRate(
      contract.monthly_salary,
      contract.contracted_monthly_hours
    );

    // Create segments
    for (const seg of segments) {
      const segmentDays = await leaveBalanceService.calculateDurationDays(seg.from, seg.to);
      const segmentHours = seg.hours;
      const deduction = leaveBalanceService.calculatePayrollDeduction(
        seg.type,
        hourlyRate,
        segmentHours
      );

      await trx('leave_segments').insert({
        request_id: request.request_id,
        segment_type: seg.type,
        date_from: seg.from,
        date_to: seg.to,
        duration_type: durationType,
        duration_hours: segmentHours,
        duration_days: segmentDays,
        status: 'Pending',
        hourly_rate: hourlyRate,
        payroll_deduction: deduction
      });
    }

    // Update pending balance (reserve the leave)
    const createdSegments = await trx('leave_segments')
      .where({ request_id: request.request_id });
    
    await leaveBalanceService.updatePendingBalance(employeeId, createdSegments, year, 'add');

    // Create audit log
    await createAuditLog(
      request.request_id,
      null,
      employeeId,
      'Created',
      `Leave request created${isAutoSplit ? ' with auto-split' : ''}`,
      {
        splitOption,
        segments: segments.length,
        isAutoSplit
      },
      ip
    );

    if (isAutoSplit) {
      await createAuditLog(
        request.request_id,
        null,
        employeeId,
        'AutoSplit',
        `Auto-split: Paid ${splitAnalysis.availablePaidDays} days, Unpaid ${splitAnalysis.requestedPaidDays - splitAnalysis.availablePaidDays} days`,
        splitAnalysis,
        ip
      );
    }

    await createAuditLog(
      request.request_id,
      null,
      employeeId,
      'Submitted',
      'Leave request submitted for HR review',
      null,
      ip
    );

    await trx.commit();

    // TODO: Send notification to HR

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: {
        request,
        segments: createdSegments,
        isAutoSplit,
        splitAnalysis: isAutoSplit ? splitAnalysis : null
      }
    });
  } catch (error) {
    await trx.rollback();
    console.error('Submit leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit leave request',
      error: error.message
    });
  }
};

/**
 * Get leave impact analysis for HR review
 * Section 6: HR Review - Leave Impact View modal
 */
exports.getLeaveImpact = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Check if user is HR or Admin
    if (req.user.role !== 'Admin' && req.user.role !== 'HR') {
      return res.status(403).json({
        success: false,
        message: 'Only HR and Admin can view leave impact'
      });
    }

    const impact = await leaveImpactService.calculateLeaveImpact(requestId);

    res.json({
      success: true,
      data: impact
    });
  } catch (error) {
    console.error('Get leave impact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate leave impact',
      error: error.message
    });
  }
};

/**
 * Approve leave request (or specific segments)
 * Section 7: Approval logic with validations
 */
exports.approveLeaveRequest = async (req, res) => {
  const trx = await knex.transaction();

  try {
    const { requestId } = req.params;
    const {
      segmentIds, // Optional: specific segments to approve
      approveAll = true,
      comment,
      createOOO = true,
      notifyTeam = true
    } = req.body;

    const approverId = req.user.userId;
    const ip = req.ip || req.connection.remoteAddress;

    // Check if user is HR or Admin
    if (req.user.role !== 'Admin' && req.user.role !== 'HR') {
      await trx.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only HR and Admin can approve leave requests'
      });
    }

    // Get request with optimistic lock check
    const request = await trx('leave_requests')
      .where({ request_id: requestId })
      .first();

    if (!request) {
      await trx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (request.status === 'Approved') {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        message: 'Leave request already approved'
      });
    }

    // Get segments to approve
    const segmentsToApprove = segmentIds && !approveAll
      ? await trx('leave_segments')
          .where({ request_id: requestId })
          .whereIn('segment_id', segmentIds)
      : await trx('leave_segments')
          .where({ request_id: requestId });

    if (segmentsToApprove.length === 0) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        message: 'No segments found to approve'
      });
    }

    const year = new Date(segmentsToApprove[0].date_from).getFullYear();

    // CRITICAL: Re-validate balance at approval time (Section 10: Concurrency)
    const validation = await leaveBalanceService.revalidateBalance(
      request.employee_id,
      segmentsToApprove,
      year
    );

    if (!validation.isValid) {
      await trx.rollback();
      return res.status(409).json({
        success: false,
        message: 'Balance validation failed - insufficient leave balance',
        issues: validation.issues,
        action: 'require-adjustment-or-override'
      });
    }

    // Check payroll period status
    const payrollPeriod = await trx('payroll_periods')
      .where('period_code', `${year}-${String(new Date(segmentsToApprove[0].date_from).getMonth() + 1).padStart(2, '0')}`)
      .first();

    const isPayrollClosed = payrollPeriod && payrollPeriod.status === 'Closed';

    // Calculate workload risk
    const workloadRisk = await leaveImpactService.calculateWorkloadRisk(
      request.employee_id,
      request.department_id,
      segmentsToApprove
    );

    // Check if manager approval required
    if (workloadRisk.requiresManagerApproval && !req.body.managerApproved) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        message: 'Manager approval required due to high workload risk or critical tasks',
        workloadRisk,
        action: 'require-manager-approval'
      });
    }

    // Approve each segment
    for (const segment of segmentsToApprove) {
      await trx('leave_segments')
        .where({ segment_id: segment.segment_id })
        .update({
          status: 'Approved',
          approved_by: approverId,
          approved_at: knex.fn.now()
        });

      // If unpaid and payroll closed, create adjustment queue entry
      if ((segment.segment_type === 'Unpaid' || segment.segment_type === 'SickUnpaid') && 
          segment.payroll_deduction > 0 && isPayrollClosed) {
        
        await trx('payroll_adjustment_queue').insert({
          employee_id: request.employee_id,
          leave_segment_id: segment.segment_id,
          period: payrollPeriod.period_code,
          amount: segment.payroll_deduction,
          reason: `Leave deduction for ${segment.segment_type} leave (${segment.date_from} to ${segment.date_to})`,
          status: 'Pending'
        });

        await createAuditLog(
          requestId,
          segment.segment_id,
          approverId,
          'PayrollProcessed',
          `Payroll adjustment created for closed period ${payrollPeriod.period_code}`,
          { amount: segment.payroll_deduction, period: payrollPeriod.period_code },
          ip
        );
      }

      // Create attendance records for approved segment
      await this.createAttendanceRecords(trx, request.employee_id, segment);

      // Audit log for segment approval
      await createAuditLog(
        requestId,
        segment.segment_id,
        approverId,
        'Approved',
        comment || 'Segment approved',
        { segmentType: segment.segment_type, days: segment.duration_days },
        ip
      );
    }

    // Update request status
    const allSegments = await trx('leave_segments')
      .where({ request_id: requestId });
    
    const allApproved = allSegments.every(s => s.status === 'Approved');
    const someApproved = allSegments.some(s => s.status === 'Approved');

    const newStatus = allApproved ? 'Approved' : 
                      someApproved ? 'Partially_Approved' : request.status;

    await trx('leave_requests')
      .where({ request_id: requestId })
      .update({
        status: newStatus,
        approved_by: allApproved ? approverId : null,
        approved_at: allApproved ? knex.fn.now() : null,
        version: request.version + 1,
        last_modified: knex.fn.now(),
        last_modified_by: approverId
      });

    // Update leave balance (move from pending to used)
    await leaveBalanceService.updatePendingBalance(
      request.employee_id,
      segmentsToApprove,
      year,
      'subtract'
    );
    
    await leaveBalanceService.updateBalanceOnApproval(
      request.employee_id,
      segmentsToApprove,
      year
    );

    // TODO: Create OOO calendar event if requested
    // TODO: Notify employee
    // TODO: Notify team if requested

    await trx.commit();

    res.json({
      success: true,
      message: allApproved ? 'Leave request approved successfully' : 'Selected segments approved',
      data: {
        requestId,
        status: newStatus,
        approvedSegments: segmentsToApprove.length,
        totalSegments: allSegments.length
      }
    });
  } catch (error) {
    await trx.rollback();
    console.error('Approve leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve leave request',
      error: error.message
    });
  }
};

/**
 * Create attendance records for approved leave segment
 */
exports.createAttendanceRecords = async (trx, employeeId, segment) => {
  const from = new Date(segment.date_from);
  const to = new Date(segment.date_to);
  const current = new Date(from);

  // Get holidays
  const holidays = await trx('public_holidays')
    .whereBetween('date', [segment.date_from, segment.date_to])
    .where('is_mandatory', true)
    .pluck('date');

  const holidaySet = new Set(holidays.map(d => d.toISOString().split('T')[0]));

  while (current <= to) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];

    // Skip weekends and holidays
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
      // Check if attendance record exists
      const existing = await trx('attendance')
        .where({ employee_id: employeeId, date: dateStr })
        .first();

      const status = segment.duration_type === 'HalfDay' ? 'HalfDay' : 'Leave';

      if (existing) {
        // Update existing record
        await trx('attendance')
          .where({ employee_id: employeeId, date: dateStr })
          .update({ status });
      } else {
        // Create new record
        await trx('attendance').insert({
          employee_id: employeeId,
          date: dateStr,
          status,
          check_in_time: null,
          check_out_time: null
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }
};

/**
 * Reject leave request
 * Section 7: On Reject
 */
exports.rejectLeaveRequest = async (req, res) => {
  const trx = await knex.transaction();

  try {
    const { requestId } = req.params;
    const {
      segmentIds,
      rejectAll = true,
      reason
    } = req.body;

    const rejecterId = req.user.userId;
    const ip = req.ip || req.connection.remoteAddress;

    // Check if user is HR or Admin
    if (req.user.role !== 'Admin' && req.user.role !== 'HR') {
      await trx.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only HR and Admin can reject leave requests'
      });
    }

    const request = await trx('leave_requests')
      .where({ request_id: requestId })
      .first();

    if (!request) {
      await trx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Get segments to reject
    const segmentsToReject = segmentIds && !rejectAll
      ? await trx('leave_segments')
          .where({ request_id: requestId })
          .whereIn('segment_id', segmentIds)
      : await trx('leave_segments')
          .where({ request_id: requestId });

    const year = new Date(segmentsToReject[0].date_from).getFullYear();

    // Reject segments
    for (const segment of segmentsToReject) {
      await trx('leave_segments')
        .where({ segment_id: segment.segment_id })
        .update({
          status: 'Rejected',
          rejected_by: rejecterId,
          rejected_at: knex.fn.now(),
          rejection_reason: reason
        });

      await createAuditLog(
        requestId,
        segment.segment_id,
        rejecterId,
        'Rejected',
        reason || 'Segment rejected',
        { segmentType: segment.segment_type, days: segment.duration_days },
        ip
      );
    }

    // Update request status
    const allSegments = await trx('leave_segments')
      .where({ request_id: requestId });
    
    const allRejected = allSegments.every(s => s.status === 'Rejected');
    const newStatus = allRejected ? 'Rejected' : 'Partially_Approved';

    await trx('leave_requests')
      .where({ request_id: requestId })
      .update({
        status: newStatus,
        rejected_by: allRejected ? rejecterId : null,
        rejected_at: allRejected ? knex.fn.now() : null,
        rejection_reason: allRejected ? reason : null,
        version: request.version + 1,
        last_modified: knex.fn.now(),
        last_modified_by: rejecterId
      });

    // Restore balance (remove from pending)
    await leaveBalanceService.restoreBalanceOnRejection(
      request.employee_id,
      segmentsToReject,
      year
    );

    // TODO: Notify employee

    await trx.commit();

    res.json({
      success: true,
      message: allRejected ? 'Leave request rejected' : 'Selected segments rejected',
      data: {
        requestId,
        status: newStatus,
        rejectedSegments: segmentsToReject.length
      }
    });
  } catch (error) {
    await trx.rollback();
    console.error('Reject leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject leave request',
      error: error.message
    });
  }
};

/**
 * Get all leave requests (with filtering)
 */
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const { status, department, fromDate, toDate } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let query = knex('leave_requests as lr')
      .join('users as u', 'lr.employee_id', 'u.user_id')
      .leftJoin('departments as d', 'lr.department_id', 'd.department_id')
      .select(
        'lr.*',
        'u.first_name',
        'u.last_name',
        'u.email',
        'u.role as employee_role',
        'd.name as department_name'
      );

    // RBAC: Employees can only see their own requests
    if (userRole !== 'Admin' && userRole !== 'HR') {
      query = query.where('lr.employee_id', userId);
    }

    // Filters
    if (status) {
      query = query.where('lr.status', status);
    }

    if (department && (userRole === 'Admin' || userRole === 'HR')) {
      query = query.where('lr.department_id', department);
    }

    if (fromDate) {
      query = query.where('lr.request_date', '>=', fromDate);
    }

    if (toDate) {
      query = query.where('lr.request_date', '<=', toDate);
    }

    const requests = await query.orderBy('lr.request_date', 'desc');

    // Get segments for each request
    for (const request of requests) {
      request.segments = await knex('leave_segments')
        .where({ request_id: request.request_id });
    }

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests',
      error: error.message
    });
  }
};

/**
 * Get single leave request by ID
 */
exports.getLeaveRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const request = await knex('leave_requests as lr')
      .join('users as u', 'lr.employee_id', 'u.user_id')
      .leftJoin('departments as d', 'lr.department_id', 'd.department_id')
      .where('lr.request_id', requestId)
      .select(
        'lr.*',
        'u.first_name',
        'u.last_name',
        'u.email',
        'u.role as employee_role',
        'd.name as department_name'
      )
      .first();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // RBAC check
    if (userRole !== 'Admin' && userRole !== 'HR' && request.employee_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own leave requests'
      });
    }

    // Get segments
    request.segments = await knex('leave_segments')
      .where({ request_id: requestId });

    // Get audit trail
    request.auditTrail = await knex('leave_audit_log as lal')
      .leftJoin('users as u', 'lal.actor_id', 'u.user_id')
      .where('lal.request_id', requestId)
      .select(
        'lal.*',
        'u.first_name',
        'u.last_name'
      )
      .orderBy('lal.timestamp', 'desc');

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Get leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave request',
      error: error.message
    });
  }
};

/**
 * Get user's leave balance
 */
exports.getLeaveBalance = async (req, res) => {
  try {
    const employeeId = req.params.employeeId || req.user.userId;
    const year = req.query.year || new Date().getFullYear();

    // RBAC check
    if (req.user.role !== 'Admin' && req.user.role !== 'HR' && employeeId != req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own balance'
      });
    }

    const balance = await leaveBalanceService.getBalance(employeeId, year);

    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave balance',
      error: error.message
    });
  }
};
