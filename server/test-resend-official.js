/**
 * Test Resend Email - Official Documentation Format
 * Run: node test-resend-official.js
 */

require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResendEmail() {
  console.log('🧪 Testing Resend Email (Official Format)...\n');
  console.log('📧 From: WorkZen HRMS <onboarding@resend.dev>');
  console.log('📧 To: yadavaman1948@gmail.com (Your registered Resend email)');
  console.log('🔑 API Key:', process.env.RESEND_API_KEY ? '✅ Found' : '❌ Missing');
  console.log('');

  try {
    // Send email using official Resend format
    const { data, error } = await resend.emails.send({
      from: 'WorkZen HRMS <onboarding@resend.dev>',
      to: 'yadavaman1948@gmail.com', // Your registered Resend email
      subject: '🔐 Password Reset Test - WorkZen',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #A24689 0%, #8a3a73 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">WorkZen HRMS</h1>
          </div>
          <div style="padding: 40px; background-color: #ffffff; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333333;">Reset Your Password</h2>
            <p style="color: #666666; line-height: 1.6;">
              Click the button below to reset your WorkZen password. This link expires in 15 minutes.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/reset-password?token=test123&email=test@example.com" 
                 style="display: inline-block; padding: 14px 30px; background-color: #A24689; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Reset Password
              </a>
            </div>
            <p style="color: #999999; font-size: 14px;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
        </div>
      `,
      replyTo: 'onboarding@resend.dev',
    });

    // Check for errors
    if (error) {
      console.error('❌ RESEND API ERROR:');
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    // Success!
    console.log('✅ SUCCESS! Email sent successfully!');
    console.log('');
    console.log('📊 Email Details:');
    console.log(`   • Email ID: ${data.id}`);
    console.log(`   • Recipient: yadavaman1948@gmail.com`);
    console.log('');
    console.log('📬 Check your inbox at: yadavaman1948@gmail.com');
    console.log('   (Also check spam/junk folder)');
    console.log('');
    console.log('💡 Note: With onboarding@resend.dev, you can only send to your registered Resend email.');
    console.log('   To send to any email, verify a custom domain at https://resend.com/domains');
  } catch (error) {
    console.error('❌ EXCEPTION:', error.message);
    console.error('');
    console.error('Stack:', error.stack);
  }
}

// Run the test
testResendEmail();
