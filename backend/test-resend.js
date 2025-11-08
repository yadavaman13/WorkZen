import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    console.log('🔍 Testing Resend API...');
    console.log('API Key:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET');
    console.log('From Email:', process.env.EMAIL_FROM);
    
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: ['delivered@resend.dev'], // Resend test email
      subject: 'Test Email from WorkZen HRMS',
      html: '<h1>Test Email</h1><p>If you receive this, email service is working!</p>'
    });

    console.log('✅ Email sent successfully!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('Error:', error);
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

testEmail();
