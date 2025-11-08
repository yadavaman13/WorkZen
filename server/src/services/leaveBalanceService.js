/**
 * Leave Balance Service
 * Handles balance calculations, auto-split logic, hourly rate calculations
 * Implements all formulas from section 4 of specification
 */

const knex = require('../config/db');

class LeaveBalanceService {
  /**
   * Get employee's leave balance for a specific year
   */
  async getBalance(employeeId, year = new Date().getFullYear()) {
    const balance = await knex('leave_balances')
      .where({ employee_id: employeeId, year })
      .first();

    if (!balance) {
      // Create balance if doesn't exist
      return await this.initializeBalance(employeeId, year);
    }

    return balance;
  }

  /**
   * Initialize leave balance for an employee
   */
  async initializeBalance(employeeId, year) {
    const [balance] = await knex('leave_balances')
      .insert({
        employee_id: employeeId,
        year,
        total_allocated_paid_days: 24,
        total_allocated_sick_days: 7,
        carried_forward_days: 0,
        used_paid_days: 0,
        used_sick_days: 0,
        used_unpaid_days: 0,
        pending_paid_days: 0,
        pending_sick_days: 0,
        available_paid_days: 24,
        available_sick_days: 7
      })
      .returning('*');

    return balance;
  }

  /**
   * Get employee contract details for hourly rate calculation
   */
  async getEmployeeContract(employeeId) {
    const contract = await knex('employee_contracts')
      .where({ employee_id: employeeId, is_active: true })
      .orderBy('effective_from', 'desc')
      .first();

    if (!contract) {
      throw new Error('No active contract found for employee');
    }

    return contract;
  }

  /**
   * Calculate hourly rate
   * Formula: hourly_rate = monthly_salary / contracted_monthly_hours
   */
  calculateHourlyRate(monthlySalary, contractedMonthlyHours) {
    return parseFloat((monthlySalary / contractedMonthlyHours).toFixed(2));
  }

  /**
   * Calculate duration in hours based on duration type
   * Section 4.2: Segment duration in hours
   */
  async calculateDurationHours(durationType, fromDate, toDate, customHours = null, employeeId) {
    const contract = await this.getEmployeeContract(employeeId);
    const workingDays = await this.getWorkingDays(fromDate, toDate);
    const standardHoursPerDay = contract.contracted_monthly_hours / 22; // Assuming 22 working days per month

    switch (durationType) {
      case 'FullDay':
        return parseFloat((workingDays * standardHoursPerDay).toFixed(2));
      
      case 'HalfDay':
        return parseFloat((standardHoursPerDay / 2).toFixed(2));
      
      case 'CustomHours':
        if (!customHours) {
          throw new Error('CustomHours requires duration_hours to be specified');
        }
        return parseFloat(customHours);
      
      default:
        throw new Error('Invalid duration type');
    }
  }

  /**
   * Calculate duration in days
   */
  async calculateDurationDays(fromDate, toDate) {
    const workingDays = await this.getWorkingDays(fromDate, toDate);
    return workingDays;
  }

  /**
   * Get working days between two dates (excluding weekends and public holidays)
   */
  async getWorkingDays(fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    // Get public holidays in this range
    const holidays = await knex('public_holidays')
      .whereBetween('date', [fromDate, toDate])
      .where('is_mandatory', true)
      .pluck('date');

    const holidaySet = new Set(holidays.map(d => d.toISOString().split('T')[0]));
    
    let workingDays = 0;
    const current = new Date(from);

    while (current <= to) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0];
      
      // Skip weekends (0 = Sunday, 6 = Saturday) and public holidays
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
        workingDays++;
      }
      
      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  }

  /**
   * Calculate payroll deduction for unpaid segment
   * Section 4.3: Payroll deduction, per segment
   */
  calculatePayrollDeduction(segmentType, hourlyRate, durationHours) {
    if (segmentType === 'Paid' || segmentType === 'SickPaid' || 
        segmentType === 'MaternityPaid' || segmentType === 'PaternityPaid' ||
        segmentType === 'CompensatoryOff') {
      return 0;
    }

    // For unpaid segments
    return parseFloat((hourlyRate * durationHours).toFixed(2));
  }

  /**
   * Auto-split leave request logic
   * Section 5: Submission flow with auto-split
   * 
   * Returns: {
   *   needsSplit: boolean,
   *   availablePaidDays: number,
   *   requestedPaidDays: number,
   *   segments: [ { type, days, hours, from, to } ],
   *   warning: string
   * }
   */
  async calculateAutoSplit(employeeId, leaveType, fromDate, toDate, durationType, year = new Date().getFullYear()) {
    const balance = await this.getBalance(employeeId, year);
    const contract = await this.getEmployeeContract(employeeId);
    
    const requestedDays = await this.calculateDurationDays(fromDate, toDate);
    const requestedHours = await this.calculateDurationHours(durationType, fromDate, toDate, null, employeeId);
    const hourlyRate = this.calculateHourlyRate(contract.monthly_salary, contract.contracted_monthly_hours);

    let availableDays, usedField, pendingField;

    // Determine which balance to use based on leave type
    if (leaveType === 'Paid') {
      availableDays = balance.available_paid_days;
      usedField = 'used_paid_days';
      pendingField = 'pending_paid_days';
    } else if (leaveType === 'Sick' || leaveType === 'SickPaid') {
      availableDays = balance.available_sick_days;
      usedField = 'used_sick_days';
      pendingField = 'pending_sick_days';
    } else {
      // For unpaid or other types, no auto-split needed
      return {
        needsSplit: false,
        availablePaidDays: 0,
        requestedPaidDays: requestedDays,
        segments: [{
          type: 'Unpaid',
          days: requestedDays,
          hours: requestedHours,
          from: fromDate,
          to: toDate,
          deduction: hourlyRate * requestedHours
        }],
        warning: null
      };
    }

    // Check if auto-split needed
    if (requestedDays <= availableDays) {
      // No split needed - sufficient balance
      return {
        needsSplit: false,
        availablePaidDays: availableDays,
        requestedPaidDays: requestedDays,
        segments: [{
          type: leaveType,
          days: requestedDays,
          hours: requestedHours,
          from: fromDate,
          to: toDate,
          deduction: 0
        }],
        warning: null
      };
    }

    // Auto-split required
    const paidDays = availableDays;
    const unpaidDays = requestedDays - availableDays;
    
    // Calculate dates for split
    const splitDate = await this.calculateSplitDate(fromDate, toDate, paidDays);
    
    // Calculate hours for each segment
    const paidHours = await this.calculateDurationHours(durationType, fromDate, splitDate, null, employeeId);
    const unpaidHours = await this.calculateDurationHours(durationType, 
      new Date(new Date(splitDate).getTime() + 86400000).toISOString().split('T')[0], 
      toDate, null, employeeId);

    const segments = [
      {
        type: leaveType,
        days: paidDays,
        hours: paidHours,
        from: fromDate,
        to: splitDate,
        deduction: 0
      },
      {
        type: 'Unpaid',
        days: unpaidDays,
        hours: unpaidHours,
        from: new Date(new Date(splitDate).getTime() + 86400000).toISOString().split('T')[0],
        to: toDate,
        deduction: hourlyRate * unpaidHours
      }
    ];

    return {
      needsSplit: true,
      availablePaidDays: paidDays,
      requestedPaidDays: requestedDays,
      segments,
      warning: `You requested ${requestedDays} Paid days but only ${paidDays} paid days remain. We will auto-split to Paid: ${paidDays} days and Unpaid: ${unpaidDays} days.`
    };
  }

  /**
   * Calculate split date - find the date where paid leave ends
   */
  async calculateSplitDate(fromDate, toDate, paidDays) {
    const from = new Date(fromDate);
    let workingDaysCount = 0;
    let current = new Date(from);

    // Get holidays
    const holidays = await knex('public_holidays')
      .whereBetween('date', [fromDate, toDate])
      .where('is_mandatory', true)
      .pluck('date');

    const holidaySet = new Set(holidays.map(d => d.toISOString().split('T')[0]));

    while (workingDaysCount < paidDays) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0];
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
        workingDaysCount++;
      }
      
      if (workingDaysCount < paidDays) {
        current.setDate(current.getDate() + 1);
      }
    }

    return current.toISOString().split('T')[0];
  }

  /**
   * Update leave balance after approval
   * Section 7: On Approve - balance deduction
   */
  async updateBalanceOnApproval(employeeId, segments, year = new Date().getFullYear()) {
    const trx = await knex.transaction();

    try {
      for (const segment of segments) {
        if (segment.segment_type === 'Paid') {
          await trx('leave_balances')
            .where({ employee_id: employeeId, year })
            .increment('used_paid_days', segment.duration_days)
            .decrement('available_paid_days', segment.duration_days);
        } else if (segment.segment_type === 'SickPaid') {
          await trx('leave_balances')
            .where({ employee_id: employeeId, year })
            .increment('used_sick_days', segment.duration_days)
            .decrement('available_sick_days', segment.duration_days);
        } else if (segment.segment_type === 'Unpaid' || segment.segment_type === 'SickUnpaid') {
          await trx('leave_balances')
            .where({ employee_id: employeeId, year })
            .increment('used_unpaid_days', segment.duration_days);
        }

        // Update last_updated timestamp
        await trx('leave_balances')
          .where({ employee_id: employeeId, year })
          .update({ last_updated: knex.fn.now() });
      }

      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Update pending balance (when request submitted but not approved)
   */
  async updatePendingBalance(employeeId, segments, year = new Date().getFullYear(), operation = 'add') {
    const trx = await knex.transaction();

    try {
      for (const segment of segments) {
        const increment = operation === 'add' ? segment.duration_days : -segment.duration_days;
        
        if (segment.segment_type === 'Paid') {
          await trx('leave_balances')
            .where({ employee_id: employeeId, year })
            .increment('pending_paid_days', increment)
            .decrement('available_paid_days', increment);
        } else if (segment.segment_type === 'SickPaid') {
          await trx('leave_balances')
            .where({ employee_id: employeeId, year })
            .increment('pending_sick_days', increment)
            .decrement('available_sick_days', increment);
        }
      }

      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Restore balance on rejection
   */
  async restoreBalanceOnRejection(employeeId, segments, year = new Date().getFullYear()) {
    return await this.updatePendingBalance(employeeId, segments, year, 'subtract');
  }

  /**
   * Re-validate balance at approval time (concurrency check)
   * Section 10: Concurrency & race conditions
   */
  async revalidateBalance(employeeId, segments, year = new Date().getFullYear()) {
    const balance = await this.getBalance(employeeId, year);
    const issues = [];

    for (const segment of segments) {
      if (segment.segment_type === 'Paid') {
        if (balance.available_paid_days < segment.duration_days) {
          issues.push({
            segment,
            available: balance.available_paid_days,
            required: segment.duration_days,
            type: 'Paid',
            action: 'auto-adjust-or-override'
          });
        }
      } else if (segment.segment_type === 'SickPaid') {
        if (balance.available_sick_days < segment.duration_days) {
          issues.push({
            segment,
            available: balance.available_sick_days,
            required: segment.duration_days,
            type: 'SickPaid',
            action: 'auto-adjust-or-override'
          });
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

module.exports = new LeaveBalanceService();
