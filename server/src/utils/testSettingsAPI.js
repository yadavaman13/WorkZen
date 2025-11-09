// Test script for Settings page API endpoints

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testSettingsAPI() {
  try {
    console.log('🧪 Testing Settings Page API Endpoints\n');
    
    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@workzen.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful!');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   User: ${loginResponse.data.user.name} (${loginResponse.data.user.role})\n`);
    
    // Step 2: Fetch all users
    console.log('2️⃣ Fetching all users...');
    const usersResponse = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Found ${usersResponse.data.users.length} users:`);
    usersResponse.data.users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role} - Status: ${user.status}`);
    });
    console.log('');
    
    // Step 3: Test updating a user role
    const testUser = usersResponse.data.users.find(u => u.email === 'employee@workzen.com');
    if (testUser) {
      console.log('3️⃣ Testing role update...');
      console.log(`   Changing ${testUser.name}'s role from ${testUser.role} to hr`);
      
      const updateResponse = await axios.put(
        `${BASE_URL}/admin/users/${testUser.id}/role`,
        { role: 'hr' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log(`✅ ${updateResponse.data.msg}`);
      console.log(`   New role: ${updateResponse.data.user.role}\n`);
      
      // Revert the change
      console.log('4️⃣ Reverting role back to employee...');
      const revertResponse = await axios.put(
        `${BASE_URL}/admin/users/${testUser.id}/role`,
        { role: 'employee' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log(`✅ ${revertResponse.data.msg}`);
      console.log(`   Reverted role: ${revertResponse.data.user.role}\n`);
    }
    
    // Step 5: Test unauthorized access (login as employee)
    console.log('5️⃣ Testing unauthorized access (employee trying to access settings)...');
    const empLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'employee@workzen.com',
      password: 'employee123'
    });
    
    const empToken = empLoginResponse.data.token;
    
    try {
      await axios.get(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${empToken}` }
      });
      console.log('❌ ERROR: Employee should not be able to access this endpoint!');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Correctly blocked: ' + error.response.data.msg);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✨ All tests completed successfully!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the tests
testSettingsAPI();
