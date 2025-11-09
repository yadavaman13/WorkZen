const db = require('../config/db');

// Helper function to generate unique IDs
const generateId = (prefix) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
};

// Helper function to calculate working days between dates
const calculateWorkingDays = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// Helper function to calculate segment duration in hours
const calculateSegmentHours = async (segment, contractedHours, workingDaysPerMonth) => {
  const standardHoursPerDay = contractedHours / workingDaysPerMonth;
  
  if (segment.duration_type === 'FullDay') {
    const days = calculateWorkingDays(segment.date_from, segment.date_to);
    return days * standardHoursPerDay;
  } else if (segment.duration_type === 'HalfDay') {
    return standardHoursPerDay / 2;
  } else if (segment.duration_type === 'CustomHours') {
    return segment.duration_hours || 0;
  }
  return 0;
};

// Helper function to calculate payroll deduction
const calculatePayrollDeduction = (hourlyRate, durationHours) => {
  return hourlyRate * durationHours;
};

// 1. Get employee leave balance
async function getLeaveBalance(req, res) {
  try {
    const { employee_id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Authorization: employees can only see their own, HR/admin can see anyone's
    if (userRole === 'employee' && parseInt(employee_id) !== userId) {
      return res.status(403).json({ msg: 'Unauthorized access' });
    }

    const currentYear = new Date().getFullYear();
    
    let balance = await db('leave_balances')
      .where({ employee_id, period_year: currentYear })
      .first();

    // If no balance exists, create default
    if (!balance) {
      await db('leave_balances').insert({
        employee_id,
        leave_type: 'Annual',
        total_allocated_days: 20,
        used_days: 0,
        available_days: 20,
        period_year: currentYear
      });

      balance = await db('leave_balances')
        .where({ employee_id, period_year: currentYear })
        .first();
    }

    return res.json({ balance });
  } catch (error) {
    console.error('Get leave balance error:', error);
    return res.status(500).json({ msg: 'Server error', error: error.message });
  }
}

// 2. Submit leave request with auto-split logic
async function submitLeaveRequest(req, res) {
  const trx = await db.transaction();
  
  try {
    const userId = req.user.id;
    const {
      leave_type,
      date_from,
      date_to,
      duration_type,
      reason,
      attachments,
      contact_info,
      auto_split_option, // 'proceed', 'convert_unpaid', 'reduce_paid', 'request_override'
      requested_paid_days
    } = req.body;

    // Validate dates
    if (new Date(date_from) > new Date(date_to)) {
      await trx.rollback();
      return res.status(400).json({ msg: 'Invalid date range' });
    }

    // Get employee details
    const employee = await trx('users')
      .select('id', 'name', 'email')
      .where({ id: userId })
      .first();

    if (!employee) {
      await trx.rollback();
      return res.status(404).json({ msg: 'Employee not found' });
    }

    // Get employee contract for calculations
    const contract = await trx('employee_contracts')
      .where({ employee_id: userId, is_active: true })
      .first();

    const contractedHours = contract?.contracted_monthly_hours || 160;
    const workingDaysPerMonth = contract?.working_days_per_month || 22;
    const hourlyRate = contract?.hourly_rate || 0;

    // Get current leave balance
    const currentYear = new Date().getFullYear();
    let balance = await trx('leave_balances')
      .where({ employee_id: userId, period_year: currentYear, leave_type })
      .first();

    if (!balance) {
      // Create default balance
      await trx('leave_balances').insert({
        employee_id: userId,
        leave_type,
        total_allocated_days: 20,
        used_days: 0,
        available_days: 20,
        period_year: currentYear
      });

      balance = await trx('leave_balances')
        .where({ employee_id: userId, period_year: currentYear, leave_type })
        .first();
    }

    const availablePaidDays = balance.available_days;
    const workingDays = calculateWorkingDays(date_from, date_to);

    // Create leave request
    const requestId = generateId('LR');
    const [leaveRequest] = await trx('leave_requests')
      .insert({
        request_id: requestId,
        employee_id: userId,
        leave_type,
        reason,
        attachments: JSON.stringify(attachments || []),
        contact_info,
        status: 'Submitted',
        audit_log: JSON.stringify([{
          actor: userId,
          action: 'Submitted',
          timestamp: new Date().toISOString(),
          comment: 'Leave request submitted'
        }])
      })
      .returning('*');

    // Auto-split logic
    let segments = [];
    
    if (workingDays > availablePaidDays && auto_split_option === 'proceed') {
      // Auto-split: Paid portion
      if (availablePaidDays > 0) {
        const paidSegmentId = generateId('LS');
        const paidDays = Math.floor(availablePaidDays);
        const paidEndDate = new Date(date_from);
        paidEndDate.setDate(paidEndDate.getDate() + (paidDays - 1));

        const paidSegment = {
          segment_id: paidSegmentId,
          request_id: leaveRequest.id,
          segment_type: 'Paid',
          date_from,
          date_to: paidEndDate.toISOString().split('T')[0],
          duration_type,
          duration_days: paidDays,
          status: 'Pending',
          payroll_effect: 0
        };

        paidSegment.duration_hours = await calculateSegmentHours(
          paidSegment,
          contractedHours,
          workingDaysPerMonth
        );

        segments.push(paidSegment);
      }

      // Auto-split: Unpaid portion
      const unpaidDays = workingDays - availablePaidDays;
      if (unpaidDays > 0) {
        const unpaidSegmentId = generateId('LS');
        const unpaidStartDate = new Date(date_from);
        unpaidStartDate.setDate(unpaidStartDate.getDate() + Math.floor(availablePaidDays));

        const unpaidSegment = {
          segment_id: unpaidSegmentId,
          request_id: leaveRequest.id,
          segment_type: 'Unpaid',
          date_from: unpaidStartDate.toISOString().split('T')[0],
          date_to,
          duration_type,
          duration_days: unpaidDays,
          status: 'Pending'
        };

        unpaidSegment.duration_hours = await calculateSegmentHours(
          unpaidSegment,
          contractedHours,
          workingDaysPerMonth
        );

        unpaidSegment.payroll_effect = calculatePayrollDeduction(
          hourlyRate,
          unpaidSegment.duration_hours
        );

        segments.push(unpaidSegment);
      }

      // Update request status
      await trx('leave_requests')
        .where({ id: leaveRequest.id })
        .update({
          status: 'Submitted_AutoSplit',
          audit_log: JSON.stringify([
            ...JSON.parse(leaveRequest.audit_log),
            {
              actor: userId,
              action: 'Auto-split',
              timestamp: new Date().toISOString(),
              comment: `Auto-split: Paid ${availablePaidDays} days, Unpaid ${unpaidDays} days`
            }
          ])
        });

    } else if (auto_split_option === 'convert_unpaid') {
      // Convert entire request to unpaid
      const segmentId = generateId('LS');
      const segment = {
        segment_id: segmentId,
        request_id: leaveRequest.id,
        segment_type: 'Unpaid',
        date_from,
        date_to,
        duration_type,
        duration_days: workingDays,
        status: 'Pending'
      };

      segment.duration_hours = await calculateSegmentHours(
        segment,
        contractedHours,
        workingDaysPerMonth
      );

      segment.payroll_effect = calculatePayrollDeduction(
        hourlyRate,
        segment.duration_hours
      );

      segments.push(segment);

    } else {
      // Normal request (sufficient balance or reduced days)
      const segmentId = generateId('LS');
      const segment = {
        segment_id: segmentId,
        request_id: leaveRequest.id,
        segment_type: 'Paid',
        date_from,
        date_to,
        duration_type,
        duration_days: workingDays,
        status: 'Pending',
        payroll_effect: 0
      };

      segment.duration_hours = await calculateSegmentHours(
        segment,
        contractedHours,
        workingDaysPerMonth
      );

      segments.push(segment);
    }

    // Insert all segments
    if (segments.length > 0) {
      await trx('leave_segments').insert(segments);
    }

    await trx.commit();

    // Fetch complete request with segments
    const completeRequest = await db('leave_requests')
      .where({ id: leaveRequest.id })
      .first();

    const requestSegments = await db('leave_segments')
      .where({ request_id: leaveRequest.id });

    return res.status(201).json({
      msg: 'Leave request submitted successfully',
      request: completeRequest,
      segments: requestSegments
    });

  } catch (error) {
    await trx.rollback();
    console.error('Submit leave request error:', error);
    return res.status(500).json({ msg: 'Server error', error: error.message });
  }
}

// 3. Calculate HR Impact View
async function calculateLeaveImpact(req, res) {
  try {
    const { date_from, date_to, department } = req.query;

    if (!date_from || !date_to) {
      return res.status(400).json({ msg: 'Date range required' });
    }

    // Get all approved/pending leaves in the date range
    const leaves = await db('leave_requests as lr')
      .join('leave_segments as ls', 'lr.id', 'ls.request_id')
      .join('users as u', 'lr.employee_id', 'u.id')
      .select(
        'lr.employee_id',
        'u.name',
        'u.email',
        'u.department',
        'ls.segment_type',
        'ls.date_from',
        'ls.date_to',
        'ls.duration_days',
        'ls.duration_hours',
        'ls.payroll_effect'
      )
      .where('lr.status', 'in', ['Submitted', 'Approved', 'Submitted_AutoSplit'])
      .where('ls.date_from', '<=', date_to)
      .where('ls.date_to', '>=', date_from);

    // Filter by department if specified
    const filteredLeaves = department 
      ? leaves.filter(l => l.department === department)
      : leaves;

    // Calculate metrics
    const teamOffCount = new Set(filteredLeaves.map(l => l.employee_id)).size;
    
    const totalProductivityHours = filteredLeaves.reduce((sum, l) => 
      sum + (l.duration_hours || 0), 0
    );

    const totalPayrollEffect = filteredLeaves.reduce((sum, l) => 
      sum + (l.payroll_effect || 0), 0
    );

    // Get total employees in department
    let totalEmployees = await db('users')
      .where({ is_active: true })
      .count('* as count')
      .first();

    if (department) {
      totalEmployees = await db('users')
        .where({ is_active: true, department })
        .count('* as count')
        .first();
    }

    const totalEmpCount = totalEmployees?.count || 1;
    const workloadRiskPct = (teamOffCount / totalEmpCount) * 100;

    // Group by employee
    const employeeBreakdown = filteredLeaves.reduce((acc, leave) => {
      const key = leave.employee_id;
      if (!acc[key]) {
        acc[key] = {
          employee_id: leave.employee_id,
          name: leave.name,
          email: leave.email,
          department: leave.department,
          total_days: 0,
          total_hours: 0,
          payroll_effect: 0,
          segments: []
        };
      }
      acc[key].total_days += leave.duration_days || 0;
      acc[key].total_hours += leave.duration_hours || 0;
      acc[key].payroll_effect += leave.payroll_effect || 0;
      acc[key].segments.push({
        type: leave.segment_type,
        from: leave.date_from,
        to: leave.date_to,
        days: leave.duration_days,
        hours: leave.duration_hours
      });
      return acc;
    }, {});

    return res.json({
      impact: {
        team_off_count: teamOffCount,
        workload_risk_pct: Math.round(workloadRiskPct * 100) / 100,
        productivity_loss_hours: Math.round(totalProductivityHours * 100) / 100,
        payroll_effect_total: Math.round(totalPayrollEffect * 100) / 100,
        date_range: { from: date_from, to: date_to },
        department: department || 'All',
        total_employees: totalEmpCount
      },
      employee_breakdown: Object.values(employeeBreakdown)
    });

  } catch (error) {
    console.error('Calculate impact error:', error);
    return res.status(500).json({ msg: 'Server error', error: error.message });
  }
}

// 4. Approve leave request
async function approveLeaveRequest(req, res) {
  const trx = await db.transaction();
  
  try {
    const { requestId } = req.params;
    const approverId = req.user.id;
    const { comment } = req.body;

    // Get leave request
    const leaveRequest = await trx('leave_requests')
      .where({ id: requestId })
      .first();

    if (!leaveRequest) {
      await trx.rollback();
      return res.status(404).json({ msg: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'Submitted' && leaveRequest.status !== 'Submitted_AutoSplit') {
      await trx.rollback();
      return res.status(400).json({ msg: 'Request cannot be approved in current status' });
    }

    // Get all segments
    const segments = await trx('leave_segments')
      .where({ request_id: leaveRequest.id });

    // Re-validate balance before approval
    const currentYear = new Date().getFullYear();
    const balance = await trx('leave_balances')
      .where({ 
        employee_id: leaveRequest.employee_id, 
        period_year: currentYear,
        leave_type: leaveRequest.leave_type
      })
      .first();

    const totalPaidDays = segments
      .filter(s => s.segment_type === 'Paid')
      .reduce((sum, s) => sum + (s.duration_days || 0), 0);

    if (balance && totalPaidDays > balance.available_days) {
      await trx.rollback();
      return res.status(400).json({ 
        msg: 'Insufficient leave balance',
        available: balance.available_days,
        requested: totalPaidDays
      });
    }

    // Update balance (deduct used days)
    if (balance && totalPaidDays > 0) {
      await trx('leave_balances')
        .where({ id: balance.id })
        .update({
          used_days: balance.used_days + totalPaidDays,
          available_days: balance.available_days - totalPaidDays
        });
    }

    // Update all segments to approved
    await trx('leave_segments')
      .where({ request_id: leaveRequest.id })
      .update({ status: 'Approved' });

    // Create attendance records for leave days
    const attendanceRecords = [];
    for (const segment of segments) {
      const startDate = new Date(segment.date_from);
      const endDate = new Date(segment.date_to);
      const current = new Date(startDate);

      while (current <= endDate) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
          attendanceRecords.push({
            employee_id: leaveRequest.employee_id,
            date: current.toISOString().split('T')[0],
            status: segment.segment_type === 'Paid' ? 'Leave_Paid' : 'Leave_Unpaid',
            hours_worked: 0,
            leave_segment_id: segment.id
          });
        }
        current.setDate(current.getDate() + 1);
      }
    }

    if (attendanceRecords.length > 0) {
      await trx('attendance_records').insert(attendanceRecords);
    }

    // Check if payroll is closed for any segment
    const unpaidSegments = segments.filter(s => s.segment_type === 'Unpaid');
    for (const segment of unpaidSegments) {
      if (segment.payroll_effect > 0) {
        // TODO: Check payroll period status
        // If closed, add to payroll_adjustments table
        // For now, assume current period is open
        await trx('payroll_adjustments').insert({
          employee_id: leaveRequest.employee_id,
          leave_segment_id: segment.id,
          deduction_amount: segment.payroll_effect,
          payroll_period_month: new Date(segment.date_from).getMonth() + 1,
          payroll_period_year: new Date(segment.date_from).getFullYear(),
          status: 'Queued',
          reason: `Unpaid leave deduction: ${segment.date_from} to ${segment.date_to}`
        });
      }
    }

    // Update request status and audit log
    const auditLog = JSON.parse(leaveRequest.audit_log || '[]');
    auditLog.push({
      actor: approverId,
      action: 'Approved',
      timestamp: new Date().toISOString(),
      comment: comment || 'Leave request approved'
    });

    await trx('leave_requests')
      .where({ id: leaveRequest.id })
      .update({
        status: 'Approved',
        approved_by: approverId,
        approved_at: new Date(),
        audit_log: JSON.stringify(auditLog)
      });

    await trx.commit();

    // Fetch updated request
    const updatedRequest = await db('leave_requests')
      .where({ id: leaveRequest.id })
      .first();

    const updatedSegments = await db('leave_segments')
      .where({ request_id: leaveRequest.id });

    return res.json({
      msg: 'Leave request approved successfully',
      request: updatedRequest,
      segments: updatedSegments
    });

  } catch (error) {
    await trx.rollback();
    console.error('Approve leave error:', error);
    return res.status(500).json({ msg: 'Server error', error: error.message });
  }
}

// 5. Reject leave request
async function rejectLeaveRequest(req, res) {
  const trx = await db.transaction();
  
  try {
    const { requestId } = req.params;
    const rejectorId = req.user.id;
    const { reason } = req.body;

    if (!reason) {
      await trx.rollback();
      return res.status(400).json({ msg: 'Rejection reason required' });
    }

    const leaveRequest = await trx('leave_requests')
      .where({ id: requestId })
      .first();

    if (!leaveRequest) {
      await trx.rollback();
      return res.status(404).json({ msg: 'Leave request not found' });
    }

    if (leaveRequest.status === 'Approved' || leaveRequest.status === 'Rejected') {
      await trx.rollback();
      return res.status(400).json({ msg: 'Request already processed' });
    }

    // Update all segments to rejected
    await trx('leave_segments')
      .where({ request_id: leaveRequest.id })
      .update({ status: 'Rejected' });

    // Update request and audit log
    const auditLog = JSON.parse(leaveRequest.audit_log || '[]');
    auditLog.push({
      actor: rejectorId,
      action: 'Rejected',
      timestamp: new Date().toISOString(),
      comment: reason
    });

    await trx('leave_requests')
      .where({ id: leaveRequest.id })
      .update({
        status: 'Rejected',
        audit_log: JSON.stringify(auditLog)
      });

    await trx.commit();

    const updatedRequest = await db('leave_requests')
      .where({ id: leaveRequest.id })
      .first();

    return res.json({
      msg: 'Leave request rejected',
      request: updatedRequest
    });

  } catch (error) {
    await trx.rollback();
    console.error('Reject leave error:', error);
    return res.status(500).json({ msg: 'Server error', error: error.message });
  }
}

// 6. Get employee leave requests
async function getEmployeeLeaveRequests(req, res) {
  try {
    const { employee_id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Authorization
    if (userRole === 'employee' && parseInt(employee_id) !== userId) {
      return res.status(403).json({ msg: 'Unauthorized access' });
    }

    const requests = await db('leave_requests')
      .where({ employee_id })
      .orderBy('created_at', 'desc');

    // Fetch segments for each request
    const requestsWithSegments = await Promise.all(
      requests.map(async (request) => {
        const segments = await db('leave_segments')
          .where({ request_id: request.id });
        return { ...request, segments };
      })
    );

    return res.json({ requests: requestsWithSegments });

  } catch (error) {
    console.error('Get leave requests error:', error);
    return res.status(500).json({ msg: 'Server error', error: error.message });
  }
}

// 7. Get all leave requests (HR/Admin)
async function getAllLeaveRequests(req, res) {
  try {
    const { status, department, date_from, date_to } = req.query;

    let query = db('leave_requests as lr')
      .join('users as u', 'lr.employee_id', 'u.id')
      .select(
        'lr.*',
        'u.name as employee_name',
        'u.email as employee_email',
        'u.department as employee_department'
      )
      .orderBy('lr.created_at', 'desc');

    if (status) {
      query = query.where('lr.status', status);
    }

    if (department) {
      query = query.where('u.department', department);
    }

    if (date_from && date_to) {
      query = query.whereBetween('lr.created_at', [date_from, date_to]);
    }

    const requests = await query;

    // Fetch segments for each request
    const requestsWithSegments = await Promise.all(
      requests.map(async (request) => {
        const segments = await db('leave_segments')
          .where({ request_id: request.id });
        return { ...request, segments };
      })
    );

    return res.json({ requests: requestsWithSegments });

  } catch (error) {
    console.error('Get all leave requests error:', error);
    return res.status(500).json({ msg: 'Server error', error: error.message });
  }
}

module.exports = {
  getLeaveBalance,
  submitLeaveRequest,
  calculateLeaveImpact,
  approveLeaveRequest,
  rejectLeaveRequest,
  getEmployeeLeaveRequests,
  getAllLeaveRequests
};
