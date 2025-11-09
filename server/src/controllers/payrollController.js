const PayrollService = require('../services/PayrollService');
const PayrunService = require('../services/PayrunService');
const DashboardService = require('../services/DashboardService');

/**
 * Get dashboard data for payroll overview
 */
const getDashboard = async (req, res) => {
  try {
    const { periodId } = req.query;

    const dashboardData = await DashboardService.getDashboardData(periodId);
    const summaryStats = await DashboardService.getSummaryStats();

    res.status(200).json({
      success: true,
      data: {
        ...dashboardData,
        summary: summaryStats
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

/**
 * Create a new payroll run
 */
const createPayrun = async (req, res) => {
  try {
    const { periodId, force } = req.body;
    const userId = req.user.id;

    if (!periodId) {
      return res.status(400).json({
        success: false,
        message: 'Payroll period ID is required'
      });
    }

    const result = await PayrunService.createPayrollRun(periodId, userId, force);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      message: 'Payroll run created successfully',
      data: result.payrun,
      warnings: result.warnings
    });
  } catch (error) {
    console.error('Error creating payroll run:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payroll run',
      error: error.message
    });
  }
};

/**
 * Get payroll run details with payslips
 */
const getPayrunDetails = async (req, res) => {
  try {
    const { payrunId } = req.params;

    const payrunData = await PayrunService.getPayrunSummary(payrunId);

    res.status(200).json({
      success: true,
      data: payrunData
    });
  } catch (error) {
    console.error('Error fetching payrun details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payrun details',
      error: error.message
    });
  }
};

/**
 * Get all payslips for a specific employee
 */
const getEmployeePayslips = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit } = req.query;

    const payslips = await PayrunService.getEmployeePayslips(
      parseInt(employeeId),
      limit ? parseInt(limit) : 12
    );

    res.status(200).json({
      success: true,
      data: payslips
    });
  } catch (error) {
    console.error('Error fetching employee payslips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee payslips',
      error: error.message
    });
  }
};

/**
 * Get payslip details
 */
const getPayslipDetails = async (req, res) => {
  try {
    const { payslipId } = req.params;

    const payslip = await PayrollService.getPayslipDetails(payslipId);

    res.status(200).json({
      success: true,
      data: payslip
    });
  } catch (error) {
    console.error('Error fetching payslip details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payslip details',
      error: error.message
    });
  }
};

/**
 * Compute a payslip
 */
const computePayslip = async (req, res) => {
  try {
    const { payslipId } = req.params;
    const userId = req.user.id;

    // Get payslip to find employee and period
    const payslip = await PayrollService.getPayslipDetails(payslipId);

    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }

    // Get period ID from payrun
    const db = require('../config/db');
    const payrun = await db('payroll_runs')
      .where({ id: payslip.payroll_run_id })
      .first();

    // Compute payslip
    const computedData = await PayrollService.computePayslip(
      payslip.employee_id,
      payrun.payroll_period_id
    );

    // Update payslip in database
    await db('payslips')
      .where({ id: payslipId })
      .update({
        gross: computedData.gross,
        net: computedData.net,
        components: JSON.stringify(computedData.components),
        deductions: JSON.stringify(computedData.deductions),
        attendance_data: JSON.stringify(computedData.attendance),
        status: 'computed',
        updated_at: new Date()
      });

    // Add audit log
    await db('payroll_audit_logs').insert({
      entity_type: 'payslip',
      entity_id: payslipId,
      action: 'computed',
      actor_id: userId,
      data: JSON.stringify(computedData),
      created_at: new Date()
    });

    // Update payroll run totals
    const totals = await db('payslips')
      .where({ payroll_run_id: payslip.payroll_run_id })
      .whereIn('status', ['computed', 'validated'])
      .sum('gross as total_gross')
      .sum('net as total_net')
      .first();

    await db('payroll_runs')
      .where({ id: payslip.payroll_run_id })
      .update({
        total_gross: totals.total_gross || 0,
        total_net: totals.total_net || 0
      });

    res.status(200).json({
      success: true,
      message: 'Payslip computed successfully',
      data: {
        ...payslip,
        ...computedData,
        status: 'computed'
      }
    });
  } catch (error) {
    console.error('Error computing payslip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compute payslip',
      error: error.message
    });
  }
};

/**
 * Validate a payslip
 */
const validatePayslip = async (req, res) => {
  try {
    const { payslipId } = req.params;
    const userId = req.user.id;

    const payslip = await PayrollService.validatePayslip(payslipId, userId);

    res.status(200).json({
      success: true,
      message: 'Payslip validated successfully',
      data: payslip
    });
  } catch (error) {
    console.error('Error validating payslip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate payslip',
      error: error.message
    });
  }
};

/**
 * Cancel a payslip
 */
const cancelPayslip = async (req, res) => {
  try {
    const { payslipId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const payslip = await PayrollService.cancelPayslip(payslipId, userId, reason);

    res.status(200).json({
      success: true,
      message: 'Payslip cancelled successfully',
      data: payslip
    });
  } catch (error) {
    console.error('Error cancelling payslip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel payslip',
      error: error.message
    });
  }
};

/**
 * Auto-compute all payslips in a payrun
 */
const autoComputePayrun = async (req, res) => {
  try {
    const { payrunId } = req.params;

    const results = await PayrunService.autoComputePayslips(payrunId);

    res.status(200).json({
      success: true,
      message: `Computed ${results.computed} out of ${results.total} payslips`,
      data: results
    });
  } catch (error) {
    console.error('Error auto-computing payrun:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-compute payrun',
      error: error.message
    });
  }
};

/**
 * Get all payroll periods
 */
const getPayrollPeriods = async (req, res) => {
  try {
    const db = require('../config/database');
    
    const periods = await db('payroll_periods')
      .select('id', 'period_name', 'start_date', 'end_date', 'status')
      .orderBy('start_date', 'desc');

    res.status(200).json({
      success: true,
      data: periods
    });
  } catch (error) {
    console.error('Error fetching payroll periods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll periods',
      error: error.message
    });
  }
};

module.exports = {
  getDashboard,
  createPayrun,
  getPayrunDetails,
  getEmployeePayslips,
  getPayslipDetails,
  computePayslip,
  validatePayslip,
  cancelPayslip,
  autoComputePayrun,
  getPayrollPeriods
};
