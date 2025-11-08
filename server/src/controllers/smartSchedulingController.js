const knex = require('../config/db');

// AI-Powered Smart Scheduling Assistant

// Analyze leave conflicts and suggest optimal dates
const getSmartSchedulingSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fromDate, toDate, leaveType } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: 'From date and to date are required'
      });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const requestedDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

    // Get user's department/team
    const user = await knex('users').where({ id: userId }).first();
    
    // 1. Check team members on leave during requested period
    const teamOnLeave = await knex('time_off_requests as tor')
      .select('tor.*', 'u.name as employee_name', 'u.role')
      .join('users as u', 'tor.user_id', 'u.id')
      .where('tor.status', 'approved')
      .where(function() {
        this.whereBetween('tor.from_date', [from, to])
          .orWhereBetween('tor.to_date', [from, to])
          .orWhere(function() {
            this.where('tor.from_date', '<=', from)
              .andWhere('tor.to_date', '>=', to);
          });
      })
      .andWhere('tor.user_id', '!=', userId);

    // 2. Analyze historical approval patterns
    const historicalData = await knex('time_off_requests')
      .select('leave_type', 'status')
      .where('user_id', userId)
      .whereIn('status', ['approved', 'rejected']);

    const approvalRate = historicalData.length > 0
      ? (historicalData.filter(r => r.status === 'approved').length / historicalData.length) * 100
      : 85; // Default 85% if no history

    const typeApprovalRate = historicalData.filter(r => r.leave_type === leaveType);
    const typeSpecificRate = typeApprovalRate.length > 0
      ? (typeApprovalRate.filter(r => r.status === 'approved').length / typeApprovalRate.length) * 100
      : approvalRate;

    // 3. Calculate coverage risk
    const totalTeamSize = await knex('users').count('* as count').first();
    const teamSize = parseInt(totalTeamSize.count) || 10;
    const peopleOnLeave = teamOnLeave.length;
    const coveragePercentage = Math.round(((teamSize - peopleOnLeave - 1) / teamSize) * 100);

    // 4. Check for critical roles on leave
    const criticalRolesOnLeave = teamOnLeave.filter(leave => 
      leave.role === 'Admin' || leave.role === 'Manager' || leave.critical_role_flag === 'Yes'
    );

    // 5. Identify busy periods (many pending/approved leaves)
    const busyPeriod = await knex('time_off_requests')
      .count('* as count')
      .where('status', 'approved')
      .where(function() {
        this.whereBetween('from_date', [from, to])
          .orWhereBetween('to_date', [from, to]);
      })
      .first();

    const isBusyPeriod = parseInt(busyPeriod.count) >= Math.ceil(teamSize * 0.2); // 20% threshold

    // 6. Generate risk score (0-100, lower is better)
    let riskScore = 0;
    const risks = [];
    const warnings = [];

    if (peopleOnLeave > 0) {
      riskScore += peopleOnLeave * 15;
      warnings.push(`${peopleOnLeave} team member(s) already on leave during this period`);
    }

    if (criticalRolesOnLeave.length > 0) {
      riskScore += 25;
      risks.push(`Critical role(s) on leave: ${criticalRolesOnLeave.map(l => l.employee_name).join(', ')}`);
    }

    if (coveragePercentage < 70) {
      riskScore += 20;
      risks.push(`Team coverage will drop to ${coveragePercentage}%`);
    }

    if (isBusyPeriod) {
      riskScore += 15;
      warnings.push('This is a busy period with high leave requests');
    }

    riskScore = Math.min(riskScore, 100);

    // 7. Calculate approval probability using AI logic
    let approvalProbability = 100 - (riskScore * 0.6); // Base calculation
    approvalProbability = approvalProbability * (typeSpecificRate / 100); // Adjust by history
    approvalProbability = Math.max(10, Math.min(95, approvalProbability)); // Clamp between 10-95%

    // 8. Generate alternative date suggestions
    const alternatives = await generateAlternativeDates(from, to, requestedDays, userId);

    // 9. Smart recommendations
    const recommendations = generateRecommendations({
      riskScore,
      approvalProbability,
      peopleOnLeave,
      coveragePercentage,
      criticalRolesOnLeave,
      alternatives,
      leaveType,
      userRole: user.role
    });

    res.status(200).json({
      success: true,
      data: {
        requestedPeriod: {
          fromDate,
          toDate,
          days: requestedDays
        },
        analysis: {
          approvalProbability: Math.round(approvalProbability),
          riskScore,
          riskLevel: riskScore < 30 ? 'Low' : riskScore < 60 ? 'Medium' : 'High',
          teamCoverage: coveragePercentage,
          peopleOnLeave,
          criticalRolesAffected: criticalRolesOnLeave.length
        },
        conflicts: teamOnLeave.map(leave => ({
          employee: leave.employee_name,
          role: leave.role,
          from: leave.from_date,
          to: leave.to_date,
          type: leave.leave_type,
          isCritical: leave.critical_role_flag === 'Yes'
        })),
        risks,
        warnings,
        recommendations,
        alternativeDates: alternatives,
        historicalInsight: {
          yourApprovalRate: Math.round(approvalRate),
          typeApprovalRate: Math.round(typeSpecificRate),
          totalRequests: historicalData.length
        }
      }
    });

  } catch (error) {
    console.error('Error getting smart suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate smart suggestions',
      error: error.message
    });
  }
};

// Generate alternative date suggestions
async function generateAlternativeDates(requestedFrom, requestedTo, days, userId) {
  const alternatives = [];
  const today = new Date();
  const searchStart = new Date(Math.max(today, requestedFrom));
  const searchEnd = new Date(requestedFrom);
  searchEnd.setMonth(searchEnd.getMonth() + 3); // Look 3 months ahead

  // Find 3 alternative periods with lower conflict
  const periods = [];
  for (let d = new Date(searchStart); d <= searchEnd; d.setDate(d.getDate() + 1)) {
    const periodEnd = new Date(d);
    periodEnd.setDate(periodEnd.getDate() + days - 1);

    if (periodEnd > searchEnd) break;

    // Skip if same as requested period
    if (d.getTime() === requestedFrom.getTime()) continue;

    // Check conflicts for this period
    const conflicts = await knex('time_off_requests')
      .count('* as count')
      .where('status', 'approved')
      .where(function() {
        this.whereBetween('from_date', [d, periodEnd])
          .orWhereBetween('to_date', [d, periodEnd]);
      })
      .andWhere('user_id', '!=', userId)
      .first();

    periods.push({
      from: new Date(d),
      to: new Date(periodEnd),
      conflicts: parseInt(conflicts.count)
    });
  }

  // Sort by least conflicts and take top 3
  periods.sort((a, b) => a.conflicts - b.conflicts);
  
  for (let i = 0; i < Math.min(3, periods.length); i++) {
    const period = periods[i];
    const score = Math.max(0, 100 - (period.conflicts * 20));
    
    alternatives.push({
      fromDate: period.from.toISOString().split('T')[0],
      toDate: period.to.toISOString().split('T')[0],
      score,
      conflictCount: period.conflicts,
      reason: period.conflicts === 0 
        ? 'No team conflicts - Optimal timing!' 
        : `Only ${period.conflicts} team member(s) on leave`,
      recommended: i === 0
    });
  }

  return alternatives;
}

// Generate smart recommendations based on analysis
function generateRecommendations(data) {
  const recommendations = [];

  // High approval probability
  if (data.approvalProbability >= 80) {
    recommendations.push({
      type: 'success',
      icon: '✅',
      message: 'Great timing! High approval probability',
      priority: 'low'
    });
  }

  // Low approval probability - suggest alternatives
  if (data.approvalProbability < 50 && data.alternatives.length > 0) {
    const best = data.alternatives[0];
    recommendations.push({
      type: 'warning',
      icon: '⚠️',
      message: `Consider ${best.fromDate} to ${best.toDate} instead (${best.reason})`,
      priority: 'high',
      action: {
        type: 'use_alternative',
        dates: { from: best.fromDate, to: best.toDate }
      }
    });
  }

  // Too many people on leave
  if (data.peopleOnLeave >= 3) {
    recommendations.push({
      type: 'warning',
      icon: '👥',
      message: `${data.peopleOnLeave} team members already on leave - consider rescheduling`,
      priority: 'high'
    });
  }

  // Critical role conflict
  if (data.criticalRolesAffected > 0) {
    recommendations.push({
      type: 'danger',
      icon: '🚨',
      message: 'Critical team member(s) on leave - high rejection risk',
      priority: 'critical'
    });
  }

  // Low coverage
  if (data.coveragePercentage < 70) {
    recommendations.push({
      type: 'danger',
      icon: '📉',
      message: `Team coverage drops to ${data.coveragePercentage}% - Request may be rejected`,
      priority: 'critical'
    });
  }

  // Good coverage
  if (data.coveragePercentage >= 85 && data.peopleOnLeave === 0) {
    recommendations.push({
      type: 'success',
      icon: '🎯',
      message: 'Perfect timing - no team conflicts detected!',
      priority: 'low'
    });
  }

  // Suggest splitting leave
  if (data.riskScore > 70 && data.requestedPeriod?.days > 3) {
    recommendations.push({
      type: 'info',
      icon: '💡',
      message: 'Consider splitting into shorter periods to improve approval chances',
      priority: 'medium'
    });
  }

  // Historical pattern insight
  if (data.historicalInsight && data.historicalInsight.yourApprovalRate < 70) {
    recommendations.push({
      type: 'info',
      icon: '📊',
      message: `Your ${data.leaveType} leave approval rate is ${data.historicalInsight.typeApprovalRate}% - plan carefully`,
      priority: 'medium'
    });
  }

  // Success pattern
  if (data.historicalInsight && data.historicalInsight.yourApprovalRate >= 90) {
    recommendations.push({
      type: 'success',
      icon: '⭐',
      message: 'You have an excellent approval history - keep it up!',
      priority: 'low'
    });
  }

  return recommendations.sort((a, b) => {
    const priority = { critical: 0, high: 1, medium: 2, low: 3 };
    return priority[a.priority] - priority[b.priority];
  });
}

module.exports = {
  getSmartSchedulingSuggestions
};
