#!/usr/bin/env node

/**
 * Email Testing Script
 * Tests all email endpoints with real data
 * 
 * Usage: node test-email.js
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'http://localhost:5000/api';
const TEST_CONFIG = {
  email_from: 'ankursingh3992@gmail.com',
  email_to: 'asr@gmail.com',
  temporary_password: 'TempPass123@456',
  reset_token: 'reset_token_' + Date.now(),
  login_url: 'http://localhost:5173'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(level, message, data = null) {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${timestamp}]`;
  
  switch(level) {
    case 'info':
      console.log(`${colors.blue}${prefix} ℹ️  ${message}${colors.reset}`);
      break;
    case 'success':
      console.log(`${colors.green}${prefix} ✅ ${message}${colors.reset}`);
      break;
    case 'error':
      console.log(`${colors.red}${prefix} ❌ ${message}${colors.reset}`);
      break;
    case 'warning':
      console.log(`${colors.yellow}${prefix} ⚠️  ${message}${colors.reset}`);
      break;
    case 'test':
      console.log(`${colors.magenta}${prefix} 🧪 ${message}${colors.reset}`);
      break;
    case 'debug':
      console.log(`${colors.dim}${prefix} 🔍 ${message}${colors.reset}`);
      break;
  }
  
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function getAuthToken() {
  try {
    log('info', 'Attempting to login as admin...');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@workzen.com',
      password: 'admin@123'
    });
    
    const token = response.data.token;
    log('success', 'Authentication successful');
    log('debug', `Token received: ${token.substring(0, 20)}...`);
    
    return token;
  } catch (error) {
    log('error', 'Authentication failed');
    log('error', error.response?.data?.message || error.message);
    throw error;
  }
}

async function getUsers(token) {
  try {
    log('info', 'Fetching users from database...');
    
    const response = await axios.get(`${BASE_URL}/manage/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const users = response.data.users || [];
    log('success', `Found ${users.length} users`);
    
    users.forEach((user, idx) => {
      log('debug', `User ${idx + 1}: ${user.email} (${user.full_name}) - Role: ${user.role}`);
    });
    
    return users;
  } catch (error) {
    log('error', 'Failed to fetch users');
    log('error', error.response?.data?.message || error.message);
    return [];
  }
}

async function testSendCredentials(token, userId) {
  try {
    log('test', `Testing: Send credentials to user ID ${userId}`);
    
    const response = await axios.post(
      `${BASE_URL}/manage/send-credentials/${userId}`,
      {
        temporaryPassword: TEST_CONFIG.temporary_password,
        loginUrl: TEST_CONFIG.login_url
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    log('success', `Credentials sent to: ${response.data.user.email}`);
    log('debug', `User: ${response.data.user.full_name}`);
    
    return true;
  } catch (error) {
    log('error', `Failed to send credentials to user ${userId}`);
    log('error', error.response?.data?.message || error.message);
    return false;
  }
}

async function testSendResetLink(token, userId) {
  try {
    log('test', `Testing: Send reset link to user ID ${userId}`);
    
    const resetLink = `${TEST_CONFIG.login_url}/reset-password?token=${TEST_CONFIG.reset_token}`;
    
    const response = await axios.post(
      `${BASE_URL}/manage/send-reset-link/${userId}`,
      {
        resetLink: resetLink,
        expiryHours: 24
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    log('success', `Reset link sent to: ${response.data.user.email}`);
    log('debug', `Link expires in: 24 hours`);
    
    return true;
  } catch (error) {
    log('error', `Failed to send reset link to user ${userId}`);
    log('error', error.response?.data?.message || error.message);
    return false;
  }
}

async function testBulkCredentials(token, userIds) {
  try {
    log('test', `Testing: Send bulk credentials to ${userIds.length} users`);
    
    const passwords = userIds.map((_, idx) => `BulkPass${idx + 1}@123`);
    
    const response = await axios.post(
      `${BASE_URL}/manage/send-bulk-credentials`,
      {
        userIds: userIds,
        temporaryPasswords: passwords,
        loginUrl: TEST_CONFIG.login_url
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    const results = response.data.results;
    log('success', `Bulk send completed`);
    log('debug', `Sent: ${results.sent}`);
    log('debug', `Failed: ${results.failed}`);
    
    if (results.details?.sent) {
      results.details.sent.forEach(item => {
        log('debug', `  ✓ ${item.email}`);
      });
    }
    
    return true;
  } catch (error) {
    log('error', 'Failed to send bulk credentials');
    log('error', error.response?.data?.message || error.message);
    return false;
  }
}

async function testEmailTemplates(token) {
  try {
    log('test', 'Testing: Get email templates');
    
    const response = await axios.get(
      `${BASE_URL}/manage/email-templates`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    const templates = response.data.templates || {};
    log('success', `Retrieved email templates`);
    log('debug', `Available templates: ${Object.keys(templates).join(', ')}`);
    
    return true;
  } catch (error) {
    log('error', 'Failed to get email templates');
    log('error', error.response?.data?.message || error.message);
    return false;
  }
}

async function checkEmailService() {
  try {
    log('info', 'Checking email service configuration...');
    
    // Try to load .env
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      log('success', 'Environment file exists');
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const hasSmtp = envContent.includes('SMTP_HOST');
      const hasUser = envContent.includes('SMTP_USER');
      
      if (hasSmtp && hasUser) {
        log('success', 'SMTP configuration found in .env');
      } else {
        log('warning', 'SMTP configuration incomplete in .env');
        log('info', 'Email sending may fail without proper SMTP configuration');
      }
    } else {
      log('warning', '.env file not found');
      log('info', 'Email service may not be configured');
    }
  } catch (error) {
    log('error', 'Failed to check configuration');
  }
}

async function main() {
  console.log(`
${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════════════════════════╗
║           WorkZen HRMS - Email Service Test Suite           ║
║                                                               ║
║  This script will test all email functionality endpoints     ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}
  `);
  
  try {
    // Step 1: Check configuration
    log('info', '════ Step 1: Configuration Check ════');
    await checkEmailService();
    
    // Step 2: Authenticate
    log('info', '════ Step 2: Authentication ════');
    const token = await getAuthToken();
    
    // Step 3: Fetch users
    log('info', '════ Step 3: Fetch Users ════');
    const users = await getUsers(token);
    
    if (users.length === 0) {
      log('error', 'No users found. Create users first.');
      process.exit(1);
    }
    
    // Step 4: Test endpoints
    log('info', '════ Step 4: Test Email Endpoints ════');
    
    const testUser = users[1] || users[0]; // Get second user if available
    const testUserId = testUser.id;
    
    log('info', `Testing with user: ${testUser.email} (ID: ${testUserId})`);
    
    const results = {
      credentials: await testSendCredentials(token, testUserId),
      resetLink: await testSendResetLink(token, testUserId),
      templates: await testEmailTemplates(token),
      bulk: await testBulkCredentials(token, [testUserId])
    };
    
    // Summary
    log('info', '════ Test Summary ════');
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    console.log(`
${colors.bright}${colors.green}
╔═══════════════════════════════════════════════════════════════╗
║                    TEST RESULTS SUMMARY                      ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}

  Tests Passed: ${passed}/${total}
  
  Individual Results:
    • Send Credentials:     ${results.credentials ? '✅ PASS' : '❌ FAIL'}
    • Send Reset Link:      ${results.resetLink ? '✅ PASS' : '❌ FAIL'}
    • Get Templates:        ${results.templates ? '✅ PASS' : '❌ FAIL'}
    • Send Bulk:            ${results.bulk ? '✅ PASS' : '❌ FAIL'}
  
  ${passed === total ? colors.green + '🎉 All tests passed!' : colors.yellow + '⚠️  Some tests failed. Check logs above.'}
${colors.reset}
    `);
    
    // Next steps
    log('info', 'Next Steps:');
    log('info', '1. Check your email inbox for test emails');
    log('info', '2. Verify email formatting and content');
    log('info', '3. Test password reset links');
    log('info', '4. Review EMAIL_SERVICE_GUIDE.md for complete documentation');
    
    process.exit(passed === total ? 0 : 1);
    
  } catch (error) {
    log('error', 'Test suite encountered an error');
    log('error', error.message);
    process.exit(1);
  }
}

// Run tests
main();
