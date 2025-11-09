const db = require('../config/db');

class DashboardService {
  /**
   * Get warnings for a specific payroll period or latest payrun
   * @param {string} periodId - Payroll period UUID (optional)
   * @returns {Object} Warnings grouped by severity
   */
  async getWarnings(periodId = null) {
    let query = db('payroll_warnings')
      .select(
        'payroll_warnings.*',
        'users.name as employee_name'
      )
      .leftJoin('users', 'payroll_warnings.employee_id', 'users.id')
      .leftJoin('payroll_runs', 'payroll_warnings.payroll_run_id', 'payroll_runs.id');

    if (periodId) {
      query = query.where('payroll_runs.payroll_period_id', periodId);
    } else {
      // Get latest payrun's warnings
      const latestPayrun = await db('payroll_runs')
        .orderBy('created_at', 'desc')
        .first();

      if (latestPayrun) {
        query = query.where('payroll_warnings.payroll_run_id', latestPayrun.id);
      }
    }

    const warnings = await query;

    // Group warnings by type
    const groupedWarnings = {
      missing_bank_account: [],
      missing_manager: [],
      unapproved_leaves: [],
      missing_attendance: [],
      insufficient_hours: []
    };

    warnings.forEach(warning => {
      if (groupedWarnings[warning.warning_type]) {
        groupedWarnings[warning.warning_type].push(warning);
      }
    });

    // Calculate counts
    const warningCounts = {
      missing_bank_account: {
        count: groupedWarnings.missing_bank_account.length,
        severity: 'high',
        message: 'employees with missing bank accounts',
        items: groupedWarnings.missing_bank_account
      },
      missing_manager: {
        count: groupedWarnings.missing_manager.length,
        severity: 'medium',
        message: 'employees with no manager assigned',
        items: groupedWarnings.missing_manager
      },
      unapproved_leaves: {
        count: groupedWarnings.unapproved_leaves.length,
        severity: 'medium',
        message: 'employees with pending leaves',
        items: groupedWarnings.unapproved_leaves
      },
      missing_attendance: {
        count: groupedWarnings.missing_attendance.length,
        severity: 'high',
        message: 'employees with incomplete attendance',
        items: groupedWarnings.missing_attendance
      }
    };

    return warningCounts;
  }

  /**
   * Get recent payroll runs
   * @param {number} limit - Number of recent payruns to fetch
   * @returns {Array} Recent payroll runs
   */
  async getRecentPayruns(limit = 5) {
    const payruns = await db('payroll_runs')
      .select(
        'payroll_runs.*',
        'payroll_periods.period_name',
        'payroll_periods.start_date as period_start',
        'payroll_periods.end_date as period_end',
        'users.name as created_by_name'
      )
      .leftJoin('payroll_periods', 'payroll_runs.payroll_period_id', 'payroll_periods.id')
      .leftJoin('users', 'payroll_runs.created_by', 'users.id')
      .orderBy('payroll_runs.created_at', 'desc')
      .limit(limit);

    // Get employee count for each payrun and extract month/year from period_name
    for (const payrun of payruns) {
      const employeeCount = await db('payslips')
        .where({ payroll_run_id: payrun.id })
        .count('* as count')
        .first();

      payrun.employee_count = employeeCount?.count || 0;
      
      // Extract month and year from period_name (e.g., "October 2025")
      if (payrun.period_name) {
        const parts = payrun.period_name.split(' ');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        payrun.month = monthNames.indexOf(parts[0]) + 1;
        payrun.year = parseInt(parts[1]) || new Date().getFullYear();
      }
    }

    return payruns;
  }

  /**
   * Get cost analytics data for charts
   * @param {string} period - Time period ('6months', '1year', 'all')
   * @param {string} groupBy - Group by ('month', 'quarter', 'year')
   * @returns {Object} Cost analytics data
   */
  async getCostAnalytics(period = '6months', groupBy = 'month') {
    let dateFilter;
    const now = new Date();

    switch (period) {
      case '6months':
        dateFilter = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '1year':
        dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        dateFilter = new Date('2000-01-01'); // All time
    }

    const payruns = await db('payroll_runs')
      .select(
        'payroll_runs.*',
        'payroll_periods.month',
        'payroll_periods.year',
        'payroll_periods.period_start'
      )
      .leftJoin('payroll_periods', 'payroll_runs.payroll_period_id', 'payroll_periods.id')
      .where('payroll_runs.created_at', '>=', dateFilter)
      .whereIn('payroll_runs.status', ['computed', 'validated', 'completed'])
      .orderBy('payroll_periods.period_start', 'asc');

    // Format data for chart
    const chartData = payruns.map(payrun => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const label = groupBy === 'month' 
        ? `${monthNames[payrun.month - 1]} ${payrun.year}`
        : `${payrun.year}`;

      return {
        label,
        gross: parseFloat(payrun.total_gross || 0),
        net: parseFloat(payrun.total_net || 0),
        deductions: parseFloat(payrun.total_gross || 0) - parseFloat(payrun.total_net || 0),
        month: payrun.month,
        year: payrun.year
      };
    });

    return {
      labels: chartData.map(d => d.label),
      datasets: [
        {
          label: 'Gross Salary',
          data: chartData.map(d => d.gross),
          borderColor: '#A24689',
          backgroundColor: 'rgba(162, 70, 137, 0.1)'
        },
        {
          label: 'Net Salary',
          data: chartData.map(d => d.net),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)'
        },
        {
          label: 'Deductions',
          data: chartData.map(d => d.deductions),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)'
        }
      ]
    };
  }

  /**
   * Get employee count analytics
   * @returns {Object} Employee count by department/role
   */
  async getEmployeeCountAnalytics() {
    // Get total active employees
    const totalEmployees = await db('users')
      .where({ status: 'active' })
      .whereIn('role', ['employee', 'hr', 'payroll'])
      .count('* as count')
      .first();

    // Get employees by role
    const byRole = await db('users')
      .select('role')
      .count('* as count')
      .where({ status: 'active' })
      .whereIn('role', ['employee', 'hr', 'payroll', 'admin'])
      .groupBy('role');

    // Get employees by department (if department exists)
    const byDepartment = await db('users')
      .select('departments.name as department')
      .count('users.id as count')
      .leftJoin('departments', 'users.department_id', 'departments.id')
      .where('users.status', 'active')
      .groupBy('departments.name')
      .havingRaw('departments.name IS NOT NULL');

    // Format for chart
    const roleChartData = {
      labels: byRole.map(r => r.role.charAt(0).toUpperCase() + r.role.slice(1)),
      datasets: [{
        label: 'Employees by Role',
        data: byRole.map(r => r.count),
        backgroundColor: [
          '#A24689',
          '#10B981',
          '#3B82F6',
          '#F59E0B'
        ]
      }]
    };

    const departmentChartData = {
      labels: byDepartment.map(d => d.department),
      datasets: [{
        label: 'Employees by Department',
        data: byDepartment.map(d => d.count),
        backgroundColor: [
          '#A24689',
          '#10B981',
          '#3B82F6',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6'
        ]
      }]
    };

    return {
      total: totalEmployees?.count || 0,
      byRole: roleChartData,
      byDepartment: departmentChartData
    };
  }

  /**
   * Get comprehensive dashboard data
   * @param {string} periodId - Payroll period UUID (optional)
   * @returns {Object} Complete dashboard data
   */
  async getDashboardData(periodId = null) {
    const [warnings, recentPayruns, costAnalytics, employeeAnalytics] = await Promise.all([
      this.getWarnings(periodId),
      this.getRecentPayruns(5),
      this.getCostAnalytics('6months', 'month'),
      this.getEmployeeCountAnalytics()
    ]);

    // Get current payroll period status
    let currentPeriod = null;
    if (periodId) {
      currentPeriod = await db('payroll_periods')
        .where({ id: periodId })
        .first();
    } else {
      currentPeriod = await db('payroll_periods')
        .where({ status: 'open' })
        .orWhere({ status: 'processing' })
        .orderBy('period_start', 'desc')
        .first();
    }

    return {
      warnings,
      recentPayruns,
      costAnalytics,
      employeeAnalytics,
      currentPeriod
    };
  }

  /**
   * Get payroll summary statistics
   * @returns {Object} Summary statistics
   */
  async getSummaryStats() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Current month payrun
    const currentMonthPayrun = await db('payroll_runs')
      .select('payroll_runs.*')
      .leftJoin('payroll_periods', 'payroll_runs.payroll_period_id', 'payroll_periods.id')
      .where({
        'payroll_periods.month': currentMonth,
        'payroll_periods.year': currentYear
      })
      .first();

    // Last month payrun
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const lastMonthPayrun = await db('payroll_runs')
      .select('payroll_runs.*')
      .leftJoin('payroll_periods', 'payroll_runs.payroll_period_id', 'payroll_periods.id')
      .where({
        'payroll_periods.month': lastMonth,
        'payroll_periods.year': lastMonthYear
      })
      .first();

    // Calculate percentage change
    const currentNet = parseFloat(currentMonthPayrun?.total_net || 0);
    const lastNet = parseFloat(lastMonthPayrun?.total_net || 0);
    const percentageChange = lastNet > 0 
      ? ((currentNet - lastNet) / lastNet * 100).toFixed(2)
      : 0;

    // Year to date total
    const ytdPayruns = await db('payroll_runs')
      .select('payroll_runs.*')
      .leftJoin('payroll_periods', 'payroll_runs.payroll_period_id', 'payroll_periods.id')
      .where('payroll_periods.year', currentYear)
      .whereIn('payroll_runs.status', ['computed', 'validated', 'completed']);

    const ytdTotal = ytdPayruns.reduce((sum, pr) => sum + parseFloat(pr.total_net || 0), 0);

    // Average salary per employee
    const totalEmployees = await db('users')
      .where({ status: 'active' })
      .whereIn('role', ['employee', 'hr', 'payroll'])
      .count('* as count')
      .first();

    const avgSalary = totalEmployees?.count > 0 
      ? (currentNet / totalEmployees.count).toFixed(2)
      : 0;

    return {
      currentMonth: {
        net: currentNet,
        gross: parseFloat(currentMonthPayrun?.total_gross || 0),
        status: currentMonthPayrun?.status || 'pending'
      },
      lastMonth: {
        net: lastNet,
        gross: parseFloat(lastMonthPayrun?.total_gross || 0)
      },
      percentageChange: parseFloat(percentageChange),
      ytdTotal: parseFloat(ytdTotal.toFixed(2)),
      avgSalary: parseFloat(avgSalary),
      totalEmployees: totalEmployees?.count || 0
    };
  }
}

module.exports = new DashboardService();
