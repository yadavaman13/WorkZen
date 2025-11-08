/**
 * Leave Impact Calculator Service
 * Calculates workload risk, productivity impact, team coverage
 * Section 4.4 & Section 6: Impact analysis for HR review
 */

const knex = require('../config/db');

class LeaveImpactService {
  /**
   * Calculate comprehensive leave impact for HR review
   * Returns all data needed for Leave Impact View modal
   */
  async calculateLeaveImpact(requestId) {
    const request = await knex('leave_requests')
      .where({ request_id: requestId })
      .first();

    if (!request) {
      throw new Error('Leave request not found');
    }

    const segments = await knex('leave_segments')
      .where({ request_id: requestId });

    // Get employee details
    const employee = await knex('users')
      .where({ user_id: request.employee_id })
      .first();

    const department = await knex('departments')
      .where({ department_id: request.department_id })
      .first();

    // Calculate all impact metrics in parallel
    const [
      teamOnLeave,
      workloadRisk,
      productivityImpact,
      payrollImpact,
      criticalTasks,
      timesheetSnapshot,
      attendanceAnomalies,
      leaveHistory,
      suggestedWindows
    ] = await Promise.all([
      this.getTeamMembersOnLeave(request.department_id, segments),
      this.calculateWorkloadRisk(request.employee_id, request.department_id, segments),
      this.calculateProductivityImpact(request.department_id, segments),
      this.calculatePayrollImpact(segments),
      this.getCriticalTasks(request.employee_id, segments),
      this.getTimesheetSnapshot(request.employee_id),
      this.getRecentAttendanceAnomalies(request.employee_id),
      this.getLeaveHistory(request.employee_id),
      this.getSuggestedRescheduleWindows(request.department_id, segments)
    ]);

    return {
      request: {
        ...request,
        employee,
        department
      },
      segments,
      impact: {
        teamOnLeave,
        workloadRisk,
        productivityImpact,
        payrollImpact,
        criticalTasks,
        timesheetSnapshot,
        attendanceAnomalies,
        leaveHistory,
        suggestedWindows
      }
    };
  }

  /**
   * Get team members on leave during the requested period
   */
  async getTeamMembersOnLeave(departmentId, segments) {
    if (!departmentId || !segments || segments.length === 0) {
      return { count: 0, members: [] };
    }

    const dateRanges = segments.map(s => ({
      from: s.date_from,
      to: s.date_to
    }));

    // Find all approved leave requests in the same department that overlap
    const overlappingLeaves = await knex('leave_requests as lr')
      .join('leave_segments as ls', 'lr.request_id', 'ls.request_id')
      .join('users as u', 'lr.employee_id', 'u.user_id')
      .where('lr.department_id', departmentId)
      .whereIn('ls.status', ['Approved', 'Pending'])
      .where(function() {
        dateRanges.forEach(range => {
          this.orWhere(function() {
            this.whereBetween('ls.date_from', [range.from, range.to])
              .orWhereBetween('ls.date_to', [range.from, range.to])
              .orWhere(function() {
                this.where('ls.date_from', '<=', range.from)
                  .andWhere('ls.date_to', '>=', range.to);
              });
          });
        });
      })
      .select(
        'u.user_id',
        'u.first_name',
        'u.last_name',
        'u.email',
        'u.role',
        'ls.date_from',
        'ls.date_to',
        'ls.segment_type'
      )
      .distinct('u.user_id');

    return {
      count: overlappingLeaves.length,
      members: overlappingLeaves
    };
  }

  /**
   * Calculate workload risk percentage
   * Section 4.4: Workload Risk & Productivity Impact
   * 
   * Formula: workload_risk_pct = min(100, (team_off_count / max(1, team_size)) * 100 + critical_role_adjustment)
   */
  async calculateWorkloadRisk(employeeId, departmentId, segments) {
    // Get team size
    const teamSize = await knex('users')
      .where({ department_id: departmentId })
      .count('user_id as count')
      .first();

    const teamSizeNum = parseInt(teamSize.count) || 1;

    // Get team members on leave
    const teamOnLeave = await this.getTeamMembersOnLeave(departmentId, segments);
    const teamOffCount = teamOnLeave.count;

    // Check if employee has critical tasks during this period
    const hasCriticalTasks = await this.hasCriticalTasksDuringPeriod(employeeId, segments);
    const criticalRoleAdjustment = hasCriticalTasks ? 20 : 0;

    // Check if employee is a manager
    const employee = await knex('users')
      .where({ user_id: employeeId })
      .first();
    
    const managerAdjustment = employee.role === 'Admin' || employee.role === 'HR' ? 10 : 0;

    // Calculate base risk
    const baseRisk = (teamOffCount / Math.max(1, teamSizeNum)) * 100;
    const workloadRiskPct = Math.min(100, Math.round(baseRisk + criticalRoleAdjustment + managerAdjustment));

    // Determine risk level
    let riskLevel = 'Low';
    if (workloadRiskPct >= 60) {
      riskLevel = 'High';
    } else if (workloadRiskPct >= 30) {
      riskLevel = 'Medium';
    }

    return {
      percentage: workloadRiskPct,
      level: riskLevel,
      factors: {
        teamSize: teamSizeNum,
        teamOffCount,
        hasCriticalTasks,
        isManager: managerAdjustment > 0,
        baseRisk: Math.round(baseRisk)
      },
      requiresManagerApproval: workloadRiskPct >= 60 || hasCriticalTasks
    };
  }

  /**
   * Calculate productivity impact in hours
   * Section 4.4: Productivity Impact
   * 
   * Formula: productivity_loss_hours = avg_hours_per_emp_last_30_days * team_off_count * overlapping_days_count
   */
  async calculateProductivityImpact(departmentId, segments) {
    // Get average hours per employee from timesheets (last 30 days)
    const avgHours = await this.getAverageDepartmentHours(departmentId);

    // Get team members on leave
    const teamOnLeave = await this.getTeamMembersOnLeave(departmentId, segments);
    
    // Calculate overlapping days
    const totalDays = segments.reduce((sum, seg) => {
      const from = new Date(seg.date_from);
      const to = new Date(seg.date_to);
      const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
      return sum + days;
    }, 0);

    const productivityLossHours = Math.round(avgHours * teamOnLeave.count * totalDays);

    return {
      estimatedLossHours: productivityLossHours,
      avgHoursPerEmployee: avgHours,
      affectedEmployees: teamOnLeave.count,
      daysImpacted: totalDays
    };
  }

  /**
   * Calculate payroll impact (deductions for unpaid segments)
   */
  async calculatePayrollImpact(segments) {
    const totalDeduction = segments.reduce((sum, seg) => {
      return sum + (parseFloat(seg.payroll_deduction) || 0);
    }, 0);

    const paidSegments = segments.filter(s => 
      s.segment_type === 'Paid' || s.segment_type === 'SickPaid'
    );
    const unpaidSegments = segments.filter(s => 
      s.segment_type === 'Unpaid' || s.segment_type === 'SickUnpaid'
    );

    return {
      totalDeduction: parseFloat(totalDeduction.toFixed(2)),
      currency: 'INR',
      paidDays: paidSegments.reduce((sum, s) => sum + s.duration_days, 0),
      unpaidDays: unpaidSegments.reduce((sum, s) => sum + s.duration_days, 0),
      segments: segments.map(s => ({
        type: s.segment_type,
        days: s.duration_days,
        hours: s.duration_hours,
        deduction: s.payroll_deduction
      }))
    };
  }

  /**
   * Get critical tasks assigned to employee during leave period
   */
  async getCriticalTasks(employeeId, segments) {
    const dateRanges = segments.map(s => ({
      from: s.date_from,
      to: s.date_to
    }));

    const tasks = await knex('critical_tasks')
      .where({ employee_id: employeeId })
      .whereIn('status', ['Pending', 'InProgress'])
      .where(function() {
        dateRanges.forEach(range => {
          this.orWhereBetween('deadline', [range.from, range.to]);
        });
      })
      .orderBy('deadline', 'asc');

    return {
      count: tasks.length,
      tasks,
      hasCritical: tasks.some(t => t.is_critical)
    };
  }

  /**
   * Check if employee has critical tasks during period
   */
  async hasCriticalTasksDuringPeriod(employeeId, segments) {
    const tasks = await this.getCriticalTasks(employeeId, segments);
    return tasks.hasCritical;
  }

  /**
   * Get timesheet snapshot (average hours per day last 30 days)
   */
  async getTimesheetSnapshot(employeeId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // This would query attendance/timesheet table
    // For now, return estimated values
    const attendance = await knex('attendance')
      .where({ employee_id: employeeId })
      .whereBetween('date', [thirtyDaysAgo.toISOString().split('T')[0], new Date().toISOString().split('T')[0]])
      .whereNotNull('check_out_time');

    if (attendance.length === 0) {
      return {
        avgHoursPerDay: 8,
        totalDays: 0,
        totalHours: 0
      };
    }

    const totalHours = attendance.reduce((sum, att) => {
      const checkIn = new Date(att.check_in_time);
      const checkOut = new Date(att.check_out_time);
      const hours = (checkOut - checkIn) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return {
      avgHoursPerDay: parseFloat((totalHours / attendance.length).toFixed(2)),
      totalDays: attendance.length,
      totalHours: Math.round(totalHours)
    };
  }

  /**
   * Get average department hours (for productivity calculation)
   */
  async getAverageDepartmentHours(departmentId) {
    // Default to 8 hours if no data
    // In production, this would query actual timesheet data
    return 8;
  }

  /**
   * Get recent attendance anomalies (last 7 days)
   */
  async getRecentAttendanceAnomalies(employeeId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const anomalies = await knex('attendance')
      .where({ employee_id: employeeId })
      .whereBetween('date', [sevenDaysAgo.toISOString().split('T')[0], new Date().toISOString().split('T')[0]])
      .where(function() {
        this.where('status', 'Absent')
          .orWhereNull('check_in_time')
          .orWhereNull('check_out_time');
      });

    return {
      count: anomalies.length,
      anomalies: anomalies.map(a => ({
        date: a.date,
        status: a.status,
        reason: a.check_in_time ? 'No check-out' : 'No check-in'
      }))
    };
  }

  /**
   * Get employee leave history (last 6 months)
   */
  async getLeaveHistory(employeeId) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const history = await knex('leave_requests as lr')
      .join('leave_segments as ls', 'lr.request_id', 'ls.request_id')
      .where('lr.employee_id', employeeId)
      .where('lr.request_date', '>=', sixMonthsAgo.toISOString())
      .select('lr.*', 'ls.segment_type', 'ls.duration_days', 'ls.status as segment_status');

    // Group by type
    const byType = {};
    history.forEach(h => {
      if (!byType[h.segment_type]) {
        byType[h.segment_type] = {
          count: 0,
          days: 0,
          approved: 0,
          rejected: 0
        };
      }
      byType[h.segment_type].count++;
      byType[h.segment_type].days += h.duration_days;
      if (h.segment_status === 'Approved') byType[h.segment_type].approved++;
      if (h.segment_status === 'Rejected') byType[h.segment_type].rejected++;
    });

    return {
      totalRequests: history.length,
      byType,
      approvalRate: history.length > 0 
        ? Math.round((history.filter(h => h.segment_status === 'Approved').length / history.length) * 100)
        : 100
    };
  }

  /**
   * Get suggested reschedule windows with lower team conflict
   */
  async getSuggestedRescheduleWindows(departmentId, segments) {
    const totalDays = segments.reduce((sum, seg) => {
      const from = new Date(seg.date_from);
      const to = new Date(seg.date_to);
      return sum + Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    }, 0);

    // Scan next 3 months for periods with fewer conflicts
    const suggestions = [];
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    // Sample 10 potential windows
    for (let i = 0; i < 10; i++) {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() + (i * 7)); // Check weekly intervals
      
      if (startDate > threeMonthsLater) break;

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + totalDays - 1);

      // Check conflicts for this window
      const conflicts = await this.getTeamMembersOnLeave(departmentId, [{
        date_from: startDate.toISOString().split('T')[0],
        date_to: endDate.toISOString().split('T')[0]
      }]);

      suggestions.push({
        fromDate: startDate.toISOString().split('T')[0],
        toDate: endDate.toISOString().split('T')[0],
        conflictCount: conflicts.count,
        score: Math.max(0, 100 - (conflicts.count * 20))
      });
    }

    // Sort by lowest conflicts
    suggestions.sort((a, b) => a.conflictCount - b.conflictCount);

    return suggestions.slice(0, 3); // Return top 3
  }

  /**
   * Check if employee can be delegated tasks
   */
  async getSuggestedDelegates(departmentId, employeeId, skills = []) {
    const colleagues = await knex('users')
      .where({ department_id: departmentId })
      .whereNot({ user_id: employeeId })
      .select('user_id', 'first_name', 'last_name', 'email', 'role');

    // In production, filter by skills, availability, workload
    return colleagues.slice(0, 5);
  }
}

module.exports = new LeaveImpactService();
