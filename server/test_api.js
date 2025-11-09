const axios = require('axios');

async function testAPI() {
  try {
    // First, login as HR to get a token
    console.log('🔐 Logging in as HR...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'hr@workzen.io',
      password: 'hr123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful! Token received.');
    console.log('User:', loginResponse.data.user);
    
    // Now fetch employees
    console.log('\n📋 Fetching employees...');
    const employeesResponse = await axios.get('http://localhost:5000/api/users/employees', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ API Response:', JSON.stringify(employeesResponse.data, null, 2));
    console.log(`\n📊 Total employees: ${employeesResponse.data.employees?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
  process.exit(0);
}

testAPI();
