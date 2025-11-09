const db = require('../config/db');
const PayrollService = require('./PayrollService');
const { v4: uuidv4 } = require('uuid');

class PayrunService {
  /**
   * Validate if payroll period is ready for processing
   * @param {string} periodId - Payroll period UUID
   * @returns {Object} Validation result
   */
  async validatePeriod(periodId) {
    const period = await db('payroll_periods')
      .where({ id: periodId })
      .first();

    if (!period) {
      return { valid: false, message: 'Payroll period not found' };
    }

    if (period.status === 'closed') {
      return { valid: false, message: 'Payroll period is already closed' };
    }

    // Check if payrun already exists for this period
    const existingPayrun = await db('payroll_runs')
      .where({ payroll_period_id: periodId })
      .whereNot('status', 'cancelled')
      .first();

    if (existingPayrun) {
      return { valid: false, message: 'Payroll run already exists for this period' };
    }

    return { valid: true };
  }

  /**
   * Run auditor checks before creating payroll
   * @param {string} periodId - Payroll period UUID
   * @returns {Array} Array of warnings
   */
  async runAuditorChecks(periodId) {
    const warnings = [];

    const period = await db('payroll_periods')
      .where({ id: periodId })
      .first();

    if (!period) {
      throw new Error('Payroll period not found');
    }

    // Get all active employees
    const employees = await db('users')
      .where({ status: 'active' })
      .whereIn('role', ['employee', 'hr', 'payroll']);

    for (const employee of employees) {
      // Check 1: Missing bank account details
      const contract = await db('contracts')
        .where({ employee_id: employee.id })
        .where('start_date', '<=', period.period_end)
        .where(function() {
          this.whereNull('end_date').orWhere('end_date', '>=', period.period_start);
        })
        .first();

      if (!contract || !contract.bank_account_number) {
        warnings.push({
          id: uuidv4(),
          employee_id: employee.id,
          employee_name: employee.name,
          warning_type: 'missing_bank_account',
          severity: 'high',
          message: `${employee.name} has no bank account on file`
        });
      }

      // Check 2: Missing manager
      const user = await db('users')
        .where({ id: employee.id })
        .first();

      if (!user.manager_id) {
        warnings.push({
          id: uuidv4(),
          employee_id: employee.id,
          employee_name: employee.name,
          warning_type: 'missing_manager',
          severity: 'medium',
          message: `${employee.name} has no manager assigned`
        });
      }

      // Check 3: Missing or insufficient attendance
      const attendanceCount = await db('attendance')
        .where({ employee_id: employee.id })
        .whereBetween('date', [period.period_start, period.period_end])
        .count('* as count')
        .first();

      const periodStart = new Date(period.period_start);
      const periodEnd = new Date(period.period_end);
      const expectedDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24)) + 1;

      if (!attendanceCount || attendanceCount.count < expectedDays * 0.5) {
        warnings.push({
          id: uuidv4(),
          employee_id: employee.id,
          employee_name: employee.name,
          warning_type: 'missing_attendance',
          severity: 'high',
          message: `${employee.name} has incomplete attendance records (${attendanceCount?.count || 0}/${expectedDays} days)`
        });
      }

      // Check 4: Unapproved leaves
      const pendingLeaves = await db('leaves')
        .where({ employee_id: employee.id })
        .where('status', 'pending')
        .where(function() {
          this.whereBetween('start_date', [period.period_start, period.period_end])
            .orWhereBetween('end_date', [period.period_start, period.period_end]);
        })
        .count('* as count')
        .first();

      if (pendingLeaves && pendingLeaves.count > 0) {
        warnings.push({
          id: uuidv4(),
          employee_id: employee.id,
          employee_name: employee.name,
          warning_type: 'unapproved_leaves',
          severity: 'medium',
          message: `${employee.name} has ${pendingLeaves.count} pending leave request(s)`
        });
      }

      // Check 5: Insufficient work hours
      const totalHours = await db('attendance')
        .where({ employee_id: employee.id })
        .whereBetween('date', [period.period_start, period.period_end])
        .sum('hours as total')
        .first();

      const expectedHours = expectedDays * 8; // Assuming 8 hours per day
      const actualHours = totalHours?.total || 0;

      if (actualHours < expectedHours * 0.7) {
        warnings.push({
          id: uuidv4(),
          employee_id: employee.id,
          employee_name: employee.name,
          warning_type: 'insufficient_hours',
          severity: 'low',
          message: `${employee.name} has low work hours (${actualHours}/${expectedHours} hours)`
        });
      }
    }

    return warnings;
  }

  /**
   * Create a new payroll run
   * @param {string} periodId - Payroll period UUID
   * @param {number} userId - User ID creating the payrun
   * @param {boolean} force - Force create even with warnings
   * @returns {Object} Created payroll run with warnings
   */
  async createPayrollRun(periodId, userId, force = false) {
    // Validate period
    const validation = await this.validatePeriod(periodId);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Run auditor checks
    const warnings = await this.runAuditorChecks(periodId);

    // If there are high severity warnings and not forced, throw error
    const highSeverityWarnings = warnings.filter(w => w.severity === 'high');
    if (highSeverityWarnings.length > 0 && !force) {
      return {
        success: false,
        warnings: warnings,
        message: `Cannot create payrun: ${highSeverityWarnings.length} high severity warning(s) found. Use force=true to override.`
      };
    }

    return await db.transaction(async (trx) => {
      const period = await trx('payroll_periods')
        .where({ id: periodId })
        .first();

      // Create payroll run
      const payrunId = uuidv4();
      await trx('payroll_runs').insert({
        id: payrunId,
        payroll_period_id: periodId,
        created_by: userId,
        total_gross: 0,
        total_net: 0,
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date()
      });

      // Save warnings to database
      if (warnings.length > 0) {
        const warningRecords = warnings.map(w => ({
          id: w.id,
          payroll_run_id: payrunId,
          employee_id: w.employee_id,
          warning_type: w.warning_type,
          severity: w.severity,
          message: w.message,
          created_at: new Date()
        }));

        await trx('payroll_warnings').insert(warningRecords);
      }

      // Add audit log
      await trx('payroll_audit_logs').insert({
        entity_type: 'payroll_run',
        entity_id: payrunId,
        action: 'created',
        actor_id: userId,
        data: JSON.stringify({
          period_id: periodId,
          warnings_count: warnings.length,
          forced: force
        }),
        created_at: new Date()
      });

      // Create draft payslips
      await this.createDraftPayslips(payrunId, period, trx);

      // Update period status
      await trx('payroll_periods')
        .where({ id: periodId })
        .update({ status: 'processing' });

      const payrun = await trx('payroll_runs')
        .where({ id: payrunId })
        .first();

      return {
        success: true,
        payrun,
        warnings
      };
    });
  }

  /**
   * Create draft payslips for all employees
   * @param {string} payrunId - Payroll run UUID
   * @param {Object} period - Payroll period object
   * @param {Object} trx - Database transaction
   */
  async createDraftPayslips(payrunId, period, trx) {
    // Get all active employees
    const employees = await trx('users')
      .where({ status: 'active' })
      .whereIn('role', ['employee', 'hr', 'payroll']);

    const payslips = employees.map(employee => ({
      id: uuidv4(),
      payroll_run_id: payrunId,
      employee_id: employee.id,
      period_start: period.period_start,
      period_end: period.period_end,
      gross: 0,
      net: 0,
      components: JSON.stringify([]),
      deductions: JSON.stringify([]),
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date()
    }));

    await trx('payslips').insert(payslips);
  }

  /**
   * Auto-compute all draft payslips in a payrun
   * @param {string} payrunId - Payroll run UUID
   * @returns {Object} Computation results
   */
  async autoComputePayslips(payrunId) {
    const payrun = await db('payroll_runs')
      .where({ id: payrunId })
      .first();

    if (!payrun) {
      throw new Error('Payroll run not found');
    }

    const period = await db('payroll_periods')
      .where({ id: payrun.payroll_period_id })
      .first();

    const payslips = await db('payslips')
      .where({ payroll_run_id: payrunId })
      .whereIn('status', ['draft', 'computed']);

    const results = {
      total: payslips.length,
      computed: 0,
      failed: 0,
      errors: []
    };

    for (const payslip of payslips) {
      try {
        // Compute payslip using PayrollService
        const computedData = await PayrollService.computePayslip(
          payslip.employee_id,
          period.id
        );

        // Update payslip
        await db('payslips')
          .where({ id: payslip.id })
          .update({
            gross: computedData.gross,
            net: computedData.net,
            components: JSON.stringify(computedData.components),
            deductions: JSON.stringify(computedData.deductions),
            attendance_data: JSON.stringify(computedData.attendance),
            status: 'computed',
            updated_at: new Date()
          });

        results.computed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          employee_id: payslip.employee_id,
          error: error.message
        });
      }
    }

    // Update payroll run totals
    const totals = await db('payslips')
      .where({ payroll_run_id: payrunId })
      .where('status', 'computed')
      .sum('gross as total_gross')
      .sum('net as total_net')
      .first();

    await db('payroll_runs')
      .where({ id: payrunId })
      .update({
        total_gross: totals.total_gross || 0,
        total_net: totals.total_net || 0,
        status: results.failed === 0 ? 'computed' : 'partial',
        updated_at: new Date()
      });

    return results;
  }

  /**
   * Get payroll run summary with payslips
   * @param {string} payrunId - Payroll run UUID
   * @returns {Object} Payrun details with payslips
   */
  async getPayrunSummary(payrunId) {
    const payrun = await db('payroll_runs')
      .select(
        'payroll_runs.*',
        'payroll_periods.period_name',
        'payroll_periods.start_date as period_start',
        'payroll_periods.end_date as period_end',
        'users.name as created_by_name'
      )
      .leftJoin('payroll_periods', 'payroll_runs.payroll_period_id', 'payroll_periods.id')
      .leftJoin('users', 'payroll_runs.created_by', 'users.id')
      .where('payroll_runs.id', payrunId)
      .first();

    if (!payrun) {
      throw new Error('Payroll run not found');
    }

    // Extract month and year from period_name
    if (payrun.period_name) {
      const parts = payrun.period_name.split(' ');
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      payrun.month = monthNames.indexOf(parts[0]) + 1;
      payrun.year = parseInt(parts[1]) || new Date().getFullYear();
    }

    // Get payslips
    const payslips = await db('payslips')
      .select(
        'payslips.*',
        'users.name as employee_name',
        'users.employee_id as employee_code'
      )
      .leftJoin('users', 'payslips.employee_id', 'users.id')
      .where('payslips.payroll_run_id', payrunId);

    // Parse JSON fields
    payslips.forEach(payslip => {
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
    });

    // Get warnings
    const warnings = await db('payroll_warnings')
      .where({ payroll_run_id: payrunId });

    return {
      ...payrun,
      payslips,
      warnings
    };
  }

  /**
   * Get payslips for a specific employee across all payruns
   * @param {number} employeeId - Employee ID
   * @param {number} limit - Number of recent payslips
   * @returns {Array} Employee payslips
   */
  async getEmployeePayslips(employeeId, limit = 12) {
    const payslips = await db('payslips')
      .select(
        'payslips.*',
        'payroll_periods.period_name',
        'payroll_runs.status as payrun_status'
      )
      .leftJoin('payroll_runs', 'payslips.payroll_run_id', 'payroll_runs.id')
      .leftJoin('payroll_periods', 'payroll_runs.payroll_period_id', 'payroll_periods.id')
      .where('payslips.employee_id', employeeId)
      .orderBy('payslips.created_at', 'desc')
      .limit(limit);

    // Parse JSON fields and extract month/year from period_name
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    payslips.forEach(payslip => {
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
      // Extract month and year from period_name
      if (payslip.period_name) {
        const parts = payslip.period_name.split(' ');
        payslip.month = monthNames.indexOf(parts[0]) + 1;
        payslip.year = parseInt(parts[1]) || new Date().getFullYear();
      }
    });

    return payslips;
  }
}

module.exports = new PayrunService();
