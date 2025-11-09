const db = require('../config/db');

class PayrollService {
  /**
   * Compute payslip for an employee for a specific payroll period
   * @param {number} employeeId - Employee ID
   * @param {string} periodId - Payroll period UUID
   * @returns {Object} Computed payslip data
   */
  async computePayslip(employeeId, periodId) {
    // Get payroll period details
    const period = await db('payroll_periods')
      .where({ id: periodId })
      .first();

    if (!period) {
      throw new Error('Payroll period not found');
    }

    // Get employee contract
    const contract = await db('contracts')
      .where({ employee_id: employeeId })
      .where('start_date', '<=', period.period_end)
      .where(function() {
        this.whereNull('end_date').orWhere('end_date', '>=', period.period_start);
      })
      .first();

    if (!contract) {
      throw new Error('No active contract found for employee');
    }

    // Get salary structure
    const structure = await db('salary_structures')
      .where({ id: contract.salary_structure_id })
      .first();

    if (!structure) {
      throw new Error('Salary structure not found');
    }

    // Calculate total days in period
    const periodStart = new Date(period.period_start);
    const periodEnd = new Date(period.period_end);
    const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24)) + 1;

    // Get attendance data
    const attendanceRecords = await db('attendance')
      .where({ employee_id: employeeId })
      .whereBetween('date', [period.period_start, period.period_end]);

    // Count present days and calculate hours
    let presentDays = 0;
    let totalHours = 0;
    attendanceRecords.forEach(record => {
      if (record.status === 'present') {
        presentDays += 1;
        totalHours += parseFloat(record.hours || 0);
      } else if (record.status === 'half') {
        presentDays += 0.5;
        totalHours += parseFloat(record.hours || 0);
      }
    });

    // Get leave data
    const leaves = await db('leaves')
      .where({ employee_id: employeeId })
      .where('status', 'approved')
      .where(function() {
        this.whereBetween('start_date', [period.period_start, period.period_end])
          .orWhereBetween('end_date', [period.period_start, period.period_end])
          .orWhere(function() {
            this.where('start_date', '<=', period.period_start)
              .andWhere('end_date', '>=', period.period_end);
          });
      });

    // Calculate leave days
    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;

    leaves.forEach(leave => {
      const leaveStart = new Date(Math.max(new Date(leave.start_date), periodStart));
      const leaveEnd = new Date(Math.min(new Date(leave.end_date), periodEnd));
      const leaveDays = Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;

      if (leave.type === 'paid' || leave.type === 'sick' || leave.type === 'casual') {
        paidLeaveDays += leaveDays;
      } else {
        unpaidLeaveDays += leaveDays;
      }
    });

    // Calculate working days (days for which salary should be paid)
    const workedDays = presentDays + paidLeaveDays;

    // Calculate gross salary components
    const components = this.calculateGrossComponents(
      contract.monthly_salary,
      workedDays,
      totalDays,
      structure
    );

    // Calculate deductions
    const deductions = this.calculateDeductions(
      components.gross,
      components.basic,
      structure
    );

    // Calculate net salary
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const net = components.gross - totalDeductions;

    return {
      gross: components.gross,
      net: net,
      components: components.breakdown,
      deductions: deductions,
      attendance: {
        totalDays,
        presentDays,
        paidLeaveDays,
        unpaidLeaveDays,
        workedDays,
        totalHours
      }
    };
  }

  /**
   * Calculate gross salary components
   * @param {number} monthlySalary - Base monthly salary
   * @param {number} workedDays - Number of days worked (including paid leaves)
   * @param {number} totalDays - Total days in the period
   * @param {Object} structure - Salary structure
   * @returns {Object} Gross components
   */
  calculateGrossComponents(monthlySalary, workedDays, totalDays, structure) {
    // Calculate gross based on worked days
    const gross = (monthlySalary * workedDays) / totalDays;

    // Basic salary (50% of gross)
    const basic = gross * (structure.basic_percentage / 100);

    // HRA (50% of basic)
    const hra = basic * (structure.hra_percentage / 100);

    // Standard Allowance (fixed ₹4167 or from structure)
    const standardAllowance = structure.standard_allowance || 4167;

    // Performance Bonus (8.33% of basic)
    const performanceBonus = basic * (structure.performance_bonus_percentage / 100);

    // Leave Travel Allowance (8.33% of basic)
    const lta = basic * (structure.lta_percentage / 100);

    // Calculate fixed allowance (remainder)
    const fixedAllowance = gross - (basic + hra + standardAllowance + performanceBonus + lta);

    const breakdown = [
      { component: 'Basic Salary', amount: parseFloat(basic.toFixed(2)), percentage: structure.basic_percentage },
      { component: 'House Rent Allowance', amount: parseFloat(hra.toFixed(2)), percentage: structure.hra_percentage },
      { component: 'Standard Allowance', amount: parseFloat(standardAllowance.toFixed(2)), percentage: ((standardAllowance / gross) * 100).toFixed(2) },
      { component: 'Performance Bonus', amount: parseFloat(performanceBonus.toFixed(2)), percentage: structure.performance_bonus_percentage },
      { component: 'Leave Travel Allowance', amount: parseFloat(lta.toFixed(2)), percentage: structure.lta_percentage },
      { component: 'Fixed Allowance', amount: parseFloat(fixedAllowance.toFixed(2)), percentage: parseFloat(((fixedAllowance / gross) * 100).toFixed(2)) }
    ];

    return {
      gross: parseFloat(gross.toFixed(2)),
      basic: parseFloat(basic.toFixed(2)),
      breakdown
    };
  }

  /**
   * Calculate deductions
   * @param {number} gross - Gross salary
   * @param {number} basic - Basic salary
   * @param {Object} structure - Salary structure
   * @returns {Array} Deductions array
   */
  calculateDeductions(gross, basic, structure) {
    const deductions = [];

    // PF Employee (12% of basic or from structure)
    const pfEmployee = basic * (structure.pf_employee_percentage / 100);
    deductions.push({
      component: 'Provident Fund (Employee)',
      amount: parseFloat(pfEmployee.toFixed(2)),
      percentage: structure.pf_employee_percentage
    });

    // PF Employer (12% of basic, informational)
    const pfEmployer = basic * (structure.pf_employer_percentage / 100);
    deductions.push({
      component: 'Provident Fund (Employer)',
      amount: parseFloat(pfEmployer.toFixed(2)),
      percentage: structure.pf_employer_percentage
    });

    // Professional Tax (fixed ₹200 or from structure)
    const professionalTax = structure.professional_tax || 200;
    deductions.push({
      component: 'Professional Tax',
      amount: parseFloat(professionalTax.toFixed(2)),
      percentage: null
    });

    return deductions;
  }

  /**
   * Generate payslip data structure
   * @param {number} payrunId - Payroll run ID
   * @param {number} employeeId - Employee ID
   * @param {string} periodStart - Period start date
   * @param {string} periodEnd - Period end date
   * @param {Object} computedData - Computed payslip data
   * @returns {Object} Payslip data ready for database insertion
   */
  generatePayslipData(payrunId, employeeId, periodStart, periodEnd, computedData) {
    return {
      payroll_run_id: payrunId,
      employee_id: employeeId,
      period_start: periodStart,
      period_end: periodEnd,
      gross: computedData.gross,
      net: computedData.net,
      components: JSON.stringify(computedData.components),
      deductions: JSON.stringify(computedData.deductions),
      attendance_data: JSON.stringify(computedData.attendance),
      status: 'computed',
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  /**
   * Get employee payslip details
   * @param {string} payslipId - Payslip UUID
   * @returns {Object} Payslip with employee and period details
   */
  async getPayslipDetails(payslipId) {
    const payslip = await db('payslips')
      .select(
        'payslips.*',
        'users.name as employee_name',
        'users.employee_id as employee_code',
        'contracts.bank_account_number',
        'payroll_periods.month',
        'payroll_periods.year'
      )
      .leftJoin('users', 'payslips.employee_id', 'users.id')
      .leftJoin('contracts', 'payslips.employee_id', 'contracts.employee_id')
      .leftJoin('payroll_runs', 'payslips.payroll_run_id', 'payroll_runs.id')
      .leftJoin('payroll_periods', 'payroll_runs.payroll_period_id', 'payroll_periods.id')
      .where('payslips.id', payslipId)
      .first();

    if (!payslip) {
      throw new Error('Payslip not found');
    }

    // Parse JSON fields
    if (payslip.components) {
      payslip.components = typeof payslip.components === 'string' 
        ? JSON.parse(payslip.components) 
        : payslip.components;
    }
    if (payslip.deductions) {
      payslip.deductions = typeof payslip.deductions === 'string' 
        ? JSON.parse(payslip.deductions) 
        : payslip.deductions;
    }
    if (payslip.attendance_data) {
      payslip.attendance_data = typeof payslip.attendance_data === 'string' 
        ? JSON.parse(payslip.attendance_data) 
        : payslip.attendance_data;
    }

    return payslip;
  }

  /**
   * Validate payslip
   * @param {string} payslipId - Payslip UUID
   * @param {number} userId - User ID performing validation
   * @returns {Object} Updated payslip
   */
  async validatePayslip(payslipId, userId) {
    return await db.transaction(async (trx) => {
      // Update payslip status
      await trx('payslips')
        .where({ id: payslipId })
        .update({
          status: 'validated',
          updated_at: new Date()
        });

      // Add audit log
      await trx('payroll_audit_logs').insert({
        entity_type: 'payslip',
        entity_id: payslipId,
        action: 'validated',
        actor_id: userId,
        data: JSON.stringify({ validated_at: new Date() }),
        created_at: new Date()
      });

      // Get updated payslip
      const payslip = await trx('payslips')
        .where({ id: payslipId })
        .first();

      // Update payroll run totals
      if (payslip.payroll_run_id) {
        const totals = await trx('payslips')
          .where({ payroll_run_id: payslip.payroll_run_id })
          .sum('gross as total_gross')
          .sum('net as total_net')
          .first();

        await trx('payroll_runs')
          .where({ id: payslip.payroll_run_id })
          .update({
            total_gross: totals.total_gross || 0,
            total_net: totals.total_net || 0
          });
      }

      return payslip;
    });
  }

  /**
   * Cancel payslip
   * @param {string} payslipId - Payslip UUID
   * @param {number} userId - User ID performing cancellation
   * @param {string} reason - Cancellation reason
   * @returns {Object} Updated payslip
   */
  async cancelPayslip(payslipId, userId, reason) {
    return await db.transaction(async (trx) => {
      // Update payslip status
      await trx('payslips')
        .where({ id: payslipId })
        .update({
          status: 'cancelled',
          updated_at: new Date()
        });

      // Add audit log
      await trx('payroll_audit_logs').insert({
        entity_type: 'payslip',
        entity_id: payslipId,
        action: 'cancelled',
        actor_id: userId,
        data: JSON.stringify({ 
          cancelled_at: new Date(),
          reason: reason 
        }),
        created_at: new Date()
      });

      return await trx('payslips')
        .where({ id: payslipId })
        .first();
    });
  }
}

module.exports = new PayrollService();
