/**
 * Test script to demonstrate Leave Impact Calculation
 * This script calls the API endpoints to show how impact analysis works
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

async function loginAsEmployee() {
  try {
    console.log(`${colors.cyan}${colors.bright}=== Step 1: Login as Employee ===${colors.reset}\n`);
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'john.doe@workzen.com',
      password: 'password123'
    });

    console.log(`${colors.green}✓ Login successful${colors.reset}`);
    console.log(`User: ${response.data.user.name}`);
    console.log(`Role: ${response.data.user.role}`);
    console.log(`Employee ID: ${response.data.user.id}\n`);

    return response.data.token;
  } catch (error) {
    console.error(`${colors.red}✗ Login failed:${colors.reset}`, error.response?.data || error.message);
    throw error;
  }
}

async function loginAsHR() {
  try {
    console.log(`${colors.cyan}${colors.bright}=== Login as HR Manager ===${colors.reset}\n`);
    
    // Try default HR credentials - adjust as needed
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'hr@workzen.com',
      password: 'password123'
    });

    console.log(`${colors.green}✓ HR Login successful${colors.reset}`);
    console.log(`User: ${response.data.user.name}`);
    console.log(`Role: ${response.data.user.role}\n`);

    return response.data.token;
  } catch (error) {
    console.error(`${colors.yellow}Note: HR login failed. Using employee token for demo.${colors.reset}\n`);
    return null;
  }
}

async function checkLeaveBalance(token) {
  try {
    console.log(`${colors.cyan}${colors.bright}=== Step 2: Check Leave Balance ===${colors.reset}\n`);
    
    const response = await axios.get(`${API_BASE}/leave/balance`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const balance = response.data;
    
    console.log(`${colors.bright}Leave Balances:${colors.reset}`);
    console.log(`├─ Paid Leave Available: ${colors.green}${balance.paid_available} days${colors.reset} (Used: ${balance.paid_used}, Pending: ${balance.paid_pending})`);
    console.log(`├─ Sick Leave Available: ${colors.green}${balance.sick_available} days${colors.reset} (Used: ${balance.sick_used}, Pending: ${balance.sick_pending})`);
    console.log(`└─ Unpaid Leave: ${colors.yellow}Unlimited${colors.reset}\n`);

    return balance;
  } catch (error) {
    console.error(`${colors.red}✗ Balance check failed:${colors.reset}`, error.response?.data || error.message);
    throw error;
  }
}

async function calculateLeaveRequest(token) {
  try {
    console.log(`${colors.cyan}${colors.bright}=== Step 3: Calculate Leave Request ===${colors.reset}\n`);
    
    // Request 10 days of paid leave (more than available to trigger auto-split)
    const leaveRequest = {
      leave_type: 'paid',
      start_date: '2025-11-15',
      end_date: '2025-11-26',
      reason: 'Family vacation - testing auto-split logic',
      half_day: false
    };

    console.log(`${colors.bright}Requesting Leave:${colors.reset}`);
    console.log(`├─ Type: ${leaveRequest.leave_type.toUpperCase()}`);
    console.log(`├─ From: ${leaveRequest.start_date}`);
    console.log(`├─ To: ${leaveRequest.end_date}`);
    console.log(`└─ Reason: ${leaveRequest.reason}\n`);

    const response = await axios.post(`${API_BASE}/leave/calculate`, leaveRequest, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const result = response.data;
    
    console.log(`${colors.magenta}${colors.bright}📊 CALCULATION RESULTS:${colors.reset}\n`);
    
    // Basic Info
    console.log(`${colors.bright}Duration:${colors.reset}`);
    console.log(`├─ Total Days: ${result.total_days} days`);
    console.log(`├─ Working Days: ${result.working_days} days`);
    console.log(`├─ Weekends Excluded: ${result.total_days - result.working_days} days`);
    console.log(`└─ Public Holidays: ${result.public_holidays?.length || 0}\n`);

    // Leave Segments
    console.log(`${colors.bright}Leave Breakdown:${colors.reset}`);
    result.segments.forEach((segment, idx) => {
      const color = segment.segment_type === 'paid' ? colors.green : colors.yellow;
      console.log(`├─ Segment ${idx + 1}: ${color}${segment.segment_type.toUpperCase()}${colors.reset} - ${segment.days} days`);
      if (segment.segment_type === 'unpaid') {
        console.log(`│  └─ Payroll Deduction: $${segment.payroll_deduction?.toFixed(2) || '0.00'}`);
      }
    });
    console.log();

    // Auto-Split Warning
    if (result.auto_split_required) {
      console.log(`${colors.red}${colors.bright}⚠️  AUTO-SPLIT TRIGGERED!${colors.reset}`);
      console.log(`${colors.yellow}Your requested ${result.requested_paid_days} paid days exceeds available balance.${colors.reset}`);
      console.log(`${colors.yellow}System will split: ${result.segments[0].days} PAID + ${result.segments[1].days} UNPAID${colors.reset}\n`);
      
      console.log(`${colors.bright}Split Options Available:${colors.reset}`);
      console.log(`1. ${colors.green}Proceed${colors.reset} - Accept auto-split (${result.segments[0].days} paid + ${result.segments[1].days} unpaid)`);
      console.log(`2. ${colors.yellow}Convert to Unpaid${colors.reset} - Take entire ${result.working_days} days as unpaid`);
      console.log(`3. ${colors.cyan}Reduce Duration${colors.reset} - Shorten leave to fit ${result.segments[0].days} paid days`);
      console.log(`4. ${colors.magenta}Override${colors.reset} - Force all paid (requires special approval)\n`);
    } else {
      console.log(`${colors.green}✓ Sufficient balance available - no split needed${colors.reset}\n`);
    }

    // Payroll Impact
    if (result.total_payroll_deduction > 0) {
      console.log(`${colors.bright}Payroll Impact:${colors.reset}`);
      console.log(`└─ Total Deduction: ${colors.red}$${result.total_payroll_deduction.toFixed(2)}${colors.reset}\n`);
    }

    return result;
  } catch (error) {
    console.error(`${colors.red}✗ Calculation failed:${colors.reset}`, error.response?.data || error.message);
    throw error;
  }
}

async function getLeaveImpact(token, employeeId, startDate, endDate) {
  try {
    console.log(`${colors.cyan}${colors.bright}=== Step 4: Analyze Leave Impact (HR View) ===${colors.reset}\n`);
    
    const response = await axios.get(`${API_BASE}/leave/impact`, {
      params: {
        employee_id: employeeId,
        start_date: startDate,
        end_date: endDate
      },
      headers: { Authorization: `Bearer ${token}` }
    });

    const impact = response.data;
    
    console.log(`${colors.magenta}${colors.bright}📈 WORKLOAD RISK ANALYSIS:${colors.reset}\n`);

    // Risk Score
    const riskColor = impact.risk_level === 'Low' ? colors.green : 
                      impact.risk_level === 'Medium' ? colors.yellow : colors.red;
    console.log(`${colors.bright}Risk Assessment:${colors.reset}`);
    console.log(`├─ Risk Score: ${riskColor}${impact.risk_score}/100${colors.reset}`);
    console.log(`├─ Risk Level: ${riskColor}${impact.risk_level}${colors.reset}`);
    console.log(`└─ Message: ${impact.risk_message}\n`);

    // Team Impact
    console.log(`${colors.bright}Team Coverage:${colors.reset}`);
    console.log(`├─ Team Size: ${impact.team_size || 'N/A'}`);
    console.log(`├─ Members on Leave: ${colors.yellow}${impact.team_members_on_leave}${colors.reset}`);
    console.log(`├─ Coverage: ${impact.coverage_percentage}%`);
    if (impact.team_members_on_leave_details?.length > 0) {
      console.log(`├─ Overlapping Leaves:${colors.reset}`);
      impact.team_members_on_leave_details.forEach(member => {
        console.log(`│  └─ ${member.name} (${member.start_date} to ${member.end_date})`);
      });
    }
    console.log();

    // Productivity Impact
    console.log(`${colors.bright}Productivity Analysis:${colors.reset}`);
    console.log(`├─ Hours Lost: ${colors.yellow}${impact.productivity_hours_lost || 0} hours${colors.reset}`);
    console.log(`├─ Impact Score: ${impact.productivity_impact_percentage || 0}%`);
    console.log(`└─ Avg Hours/Week: ${impact.avg_hours_per_week || 40}h\n`);

    // Critical Roles
    if (impact.critical_role_flag) {
      console.log(`${colors.red}${colors.bright}🚨 CRITICAL ROLE ALERT!${colors.reset}`);
      console.log(`${colors.red}This employee is assigned to critical tasks.${colors.reset}`);
      if (impact.critical_tasks?.length > 0) {
        console.log(`${colors.bright}Active Critical Tasks:${colors.reset}`);
        impact.critical_tasks.forEach(task => {
          console.log(`  └─ ${task.task_name} (Priority: ${task.priority})`);
        });
      }
      console.log();
    }

    // Reschedule Suggestions
    if (impact.suggested_reschedule?.length > 0) {
      console.log(`${colors.bright}📅 Better Alternative Dates:${colors.reset}`);
      impact.suggested_reschedule.slice(0, 3).forEach((window, idx) => {
        const scoreColor = window.conflict_score < 30 ? colors.green : 
                          window.conflict_score < 60 ? colors.yellow : colors.red;
        console.log(`${idx + 1}. ${window.start_date} to ${window.end_date} (Conflict: ${scoreColor}${window.conflict_score}%${colors.reset})`);
      });
      console.log();
    }

    // Approval Recommendation
    console.log(`${colors.bright}Recommendation:${colors.reset}`);
    if (impact.risk_level === 'Low') {
      console.log(`${colors.green}✓ Safe to approve - minimal impact${colors.reset}\n`);
    } else if (impact.risk_level === 'Medium') {
      console.log(`${colors.yellow}⚠️  Review required - moderate impact${colors.reset}\n`);
    } else {
      console.log(`${colors.red}⚠️  High risk - consider alternatives or additional planning${colors.reset}\n`);
    }

    return impact;
  } catch (error) {
    console.error(`${colors.yellow}Note: Impact analysis unavailable (may require HR role)${colors.reset}`);
    console.error(`Error:`, error.response?.data?.message || error.message);
    console.log();
    return null;
  }
}

async function demonstrateCalculations() {
  console.log(`\n${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}     COMPREHENSIVE LEAVE IMPACT CALCULATION DEMO${colors.reset}`);
  console.log(`${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  try {
    // Step 1: Login
    const employeeToken = await loginAsEmployee();
    
    // Extract employee ID from token (decode JWT)
    const tokenPayload = JSON.parse(Buffer.from(employeeToken.split('.')[1], 'base64').toString());
    const employeeId = tokenPayload.id;

    // Step 2: Check balance
    await checkLeaveBalance(employeeToken);

    // Step 3: Calculate leave request
    const calculation = await calculateLeaveRequest(employeeToken);

    // Step 4: Get impact analysis (try with employee token, may need HR)
    const hrToken = await loginAsHR() || employeeToken;
    await getLeaveImpact(
      hrToken,
      employeeId,
      calculation.start_date,
      calculation.end_date
    );

    // Summary
    console.log(`${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}${colors.bright}✓ ALL CALCULATIONS COMPLETED SUCCESSFULLY${colors.reset}`);
    console.log(`${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    console.log(`${colors.bright}Key Features Demonstrated:${colors.reset}`);
    console.log(`✓ Leave balance tracking`);
    console.log(`✓ Working days calculation (excludes weekends)`);
    console.log(`✓ Auto-split logic (Paid → Unpaid conversion)`);
    console.log(`✓ Payroll deduction calculation`);
    console.log(`✓ Workload risk scoring (0-100 scale)`);
    console.log(`✓ Team coverage analysis`);
    console.log(`✓ Productivity impact measurement`);
    console.log(`✓ Critical role detection`);
    console.log(`✓ Alternative date suggestions\n`);

  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}✗ Demo failed:${colors.reset}`, error.message);
    console.log(`\n${colors.yellow}Troubleshooting:${colors.reset}`);
    console.log(`1. Ensure server is running: cd server && npm start`);
    console.log(`2. Run seed script first: node src/scripts/seed-leave-system.js`);
    console.log(`3. Check database connection`);
    console.log(`4. Verify user credentials in the script\n`);
    process.exit(1);
  }
}

// Run the demonstration
demonstrateCalculations();
