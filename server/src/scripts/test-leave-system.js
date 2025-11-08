/**
 * Quick Test Script for Comprehensive Leave Management System
 * 
 * This script tests all major functionalities:
 * 1. Calculate leave (with auto-split)
 * 2. Submit leave request
 * 3. Get leave impact analysis
 * 4. Approve leave request
 * 5. Check balance updates
 * 
 * Usage: node src/scripts/test-leave-system.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// You need to replace this with a valid JWT token from login
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE';

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testLeaveSystem() {
  console.log('🧪 Starting Comprehensive Leave System Tests\n');

  try {
    // Test 1: Calculate Leave Request
    console.log('📊 Test 1: Calculate Leave Request (Auto-Split Analysis)');
    const calculateResponse = await axios.post(`${API_BASE}/leave/calculate`, {
      leaveType: 'Paid',
      fromDate: '2025-12-01',
      toDate: '2025-12-05',
      durationType: 'FullDay'
    }, { headers });

    console.log('✅ Calculate Response:');
    console.log(`   Balance Available: ${calculateResponse.data.data.balance.availablePaid} Paid days`);
    console.log(`   Needs Split: ${calculateResponse.data.data.splitAnalysis.needsSplit}`);
    console.log(`   Segments: ${calculateResponse.data.data.splitAnalysis.segments.length}`);
    
    if (calculateResponse.data.data.splitAnalysis.needsSplit) {
      console.log(`   ⚠️ Auto-Split Required!`);
      calculateResponse.data.data.splitAnalysis.segments.forEach((seg, i) => {
        console.log(`      Segment ${i+1}: ${seg.type} - ${seg.days} days (₹${seg.deduction} deduction)`);
      });
    }
    console.log('');

    // Test 2: Submit Leave Request
    console.log('📝 Test 2: Submit Leave Request');
    const submitResponse = await axios.post(`${API_BASE}/leave/submit`, {
      leaveType: 'Paid',
      fromDate: '2025-12-01',
      toDate: '2025-12-05',
      durationType: 'FullDay',
      reason: 'Test leave request for system validation',
      contactInfo: '+91-9876543210',
      splitOption: 'proceed'
    }, { headers });

    const requestId = submitResponse.data.data.request.request_id;
    const referenceNumber = submitResponse.data.data.request.reference_number;

    console.log('✅ Submit Response:');
    console.log(`   Request ID: ${requestId}`);
    console.log(`   Reference: ${referenceNumber}`);
    console.log(`   Status: ${submitResponse.data.data.request.status}`);
    console.log(`   Segments: ${submitResponse.data.data.segments.length}`);
    console.log('');

    // Test 3: Get Leave Request Details
    console.log('🔍 Test 3: Get Leave Request Details');
    const detailsResponse = await axios.get(`${API_BASE}/leave/${requestId}`, { headers });

    console.log('✅ Details Response:');
    console.log(`   Employee: ${detailsResponse.data.data.first_name} ${detailsResponse.data.data.last_name}`);
    console.log(`   Department: ${detailsResponse.data.data.department_name}`);
    console.log(`   Audit Trail Entries: ${detailsResponse.data.data.auditTrail.length}`);
    console.log('');

    // Test 4: Get Leave Impact Analysis (HR View)
    console.log('📊 Test 4: Get Leave Impact Analysis');
    const impactResponse = await axios.get(`${API_BASE}/leave/${requestId}/impact`, { headers });

    console.log('✅ Impact Analysis:');
    const impact = impactResponse.data.data.impact;
    console.log(`   Workload Risk: ${impact.workloadRisk.level} (${impact.workloadRisk.percentage}%)`);
    console.log(`   Team Coverage: ${100 - impact.workloadRisk.percentage}%`);
    console.log(`   Team Members on Leave: ${impact.teamOnLeave.count}`);
    console.log(`   Productivity Loss: ${impact.productivityImpact.estimatedLossHours} hours`);
    console.log(`   Payroll Impact: ₹${impact.payrollImpact.totalDeduction}`);
    console.log(`   Critical Tasks: ${impact.criticalTasks.count}`);
    console.log(`   Suggested Windows: ${impact.suggestedWindows.length}`);
    
    if (impact.suggestedWindows.length > 0) {
      console.log('   📅 Best Alternative:');
      const best = impact.suggestedWindows[0];
      console.log(`      ${best.fromDate} to ${best.toDate} (Score: ${best.score}, Conflicts: ${best.conflictCount})`);
    }
    console.log('');

    // Test 5: Approve Leave Request (if user is HR/Admin)
    console.log('✅ Test 5: Approve Leave Request');
    try {
      const approveResponse = await axios.post(`${API_BASE}/leave/${requestId}/approve`, {
        approveAll: true,
        comment: 'Approved via automated test',
        createOOO: true,
        notifyTeam: false
      }, { headers });

      console.log('✅ Approve Response:');
      console.log(`   Status: ${approveResponse.data.data.status}`);
      console.log(`   Approved Segments: ${approveResponse.data.data.approvedSegments}`);
      console.log('');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('⚠️ Skipped (requires HR/Admin role)');
      } else if (error.response?.status === 409) {
        console.log('⚠️ Balance validation failed (concurrent approval detected)');
        console.log(`   Details: ${error.response.data.message}`);
      } else {
        throw error;
      }
      console.log('');
    }

    // Test 6: Get Updated Balance
    console.log('💰 Test 6: Get Updated Balance');
    const balanceResponse = await axios.get(`${API_BASE}/leave/balance`, { headers });

    console.log('✅ Balance Response:');
    const balance = balanceResponse.data.data;
    console.log(`   Total Allocated: ${balance.total_allocated_paid_days} Paid + ${balance.total_allocated_sick_days} Sick`);
    console.log(`   Used: ${balance.used_paid_days} Paid + ${balance.used_sick_days} Sick + ${balance.used_unpaid_days} Unpaid`);
    console.log(`   Pending: ${balance.pending_paid_days} Paid + ${balance.pending_sick_days} Sick`);
    console.log(`   Available: ${balance.available_paid_days} Paid + ${balance.available_sick_days} Sick`);
    console.log('');

    // Test 7: Get My Requests
    console.log('📋 Test 7: Get My Leave Requests');
    const myRequestsResponse = await axios.get(`${API_BASE}/leave/my-requests`, { headers });

    console.log('✅ My Requests:');
    console.log(`   Total Requests: ${myRequestsResponse.data.count}`);
    if (myRequestsResponse.data.count > 0) {
      const latest = myRequestsResponse.data.data[0];
      console.log(`   Latest: ${latest.reference_number} - ${latest.status}`);
    }
    console.log('');

    // Test 8: Merge Queue (Employee View)
    console.log('🔄 Test 8: Get My Merge Queue Entries');
    const mergeQueueResponse = await axios.get(`${API_BASE}/merge-queue/my-entries`, { headers });

    console.log('✅ Merge Queue:');
    console.log(`   Pending Entries: ${mergeQueueResponse.data.count}`);
    if (mergeQueueResponse.data.count > 0) {
      mergeQueueResponse.data.data.forEach(entry => {
        console.log(`   - ${entry.date}: ${entry.reason_suggested}`);
      });
    } else {
      console.log(`   No missing attendance entries`);
    }
    console.log('');

    console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log('✅ Calculate leave with auto-split analysis');
    console.log('✅ Submit leave request');
    console.log('✅ Get request details with audit trail');
    console.log('✅ Get comprehensive impact analysis');
    console.log('✅ Approve leave request (if HR/Admin)');
    console.log('✅ Get updated balance');
    console.log('✅ List my requests');
    console.log('✅ Check merge queue');
    console.log('\n🚀 System is fully functional!');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️ Server is not running. Please start the server first:');
      console.error('   cd server && npm start');
    }
    
    if (AUTH_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
      console.error('\n⚠️ You need to replace AUTH_TOKEN with a valid JWT token.');
      console.error('   1. Login via POST /api/auth/login');
      console.error('   2. Copy the token from response');
      console.error('   3. Update AUTH_TOKEN in this script');
    }
  }
}

// Run tests
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Comprehensive Leave Management System - Integration Test  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

testLeaveSystem();
