const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5000';

async function testResetPasswordFlow() {
  console.log('🧪 Testing Reset Password Flow\n');

  try {
    // Step 1: Check if there's a recent password reset token in the database
    console.log('📋 Checking for recent password reset tokens...');
    
    const db = require('./src/config/db');
    const recentToken = await db('password_resets')
      .where('used', false)
      .orderBy('created_at', 'desc')
      .first();

    if (!recentToken) {
      console.log('❌ No unused reset tokens found in database');
      console.log('💡 Please create an employee first to generate a reset token');
      process.exit(0);
    }

    console.log('✅ Found unused token for:', recentToken.email);
    console.log('   Token:', recentToken.token.substring(0, 20) + '...');
    console.log('   Expires:', new Date(recentToken.expires_at).toLocaleString());
    console.log('   Used:', recentToken.used);

    // Step 2: Test the reset password endpoint
    console.log('\n🔧 Testing password reset endpoint...');
    
    const newPassword = 'TestPassword123!';
    
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/reset-password`, {
        token: recentToken.token,
        email: recentToken.email,
        newPassword: newPassword
      });

      console.log('✅ Password reset successful!');
      console.log('   Response:', response.data.msg);

      // Verify token was marked as used
      const updatedToken = await db('password_resets')
        .where('id', recentToken.id)
        .first();

      console.log('   Token marked as used:', updatedToken.used);

    } catch (error) {
      console.log('❌ Password reset failed!');
      console.log('   Error:', error.response?.data?.msg || error.message);
      if (error.response?.data) {
        console.log('   Full response:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // Step 3: Try using the same token again (should fail)
    console.log('\n🔒 Testing token reuse protection...');
    
    try {
      await axios.post(`${BASE_URL}/api/auth/reset-password`, {
        token: recentToken.token,
        email: recentToken.email,
        newPassword: 'AnotherPassword456!'
      });

      console.log('❌ Token reuse should have failed but succeeded!');
    } catch (error) {
      console.log('✅ Token reuse correctly blocked');
      console.log('   Error:', error.response?.data?.msg || error.message);
    }

    console.log('\n✅ All tests completed!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

testResetPasswordFlow();
