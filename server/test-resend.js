// Test Resend email following official documentation
require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

(async function () {
  console.log('🧪 Testing Resend Email (Official Format)...\n');
  console.log('📧 Sending to: yadavaman1948@gmail.com');
  console.log('🔑 API Key:', process.env.RESEND_API_KEY ? 'Found' : 'Missing');
  console.log('');

  const { data, error } = await resend.emails.send({
    from: 'WorkZen <onboarding@resend.dev>',
    to: ['yadavaman1948@gmail.com'],
    subject: '🔐 Password Reset - WorkZen',
    html: '<strong>Your password reset link is ready!</strong><br><br>This is a test email to verify Resend is working.',
  });

  if (error) {
    console.error('❌ ERROR:', error);
    return;
  }

  console.log('✅ SUCCESS! Email sent!');
  console.log('📊 Email Details:', data);
  console.log('\n📬 Check your inbox at yadavaman1948@gmail.com');
})();
