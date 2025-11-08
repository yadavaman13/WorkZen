const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendResetEmail(toEmail, resetLink) {
  const mailOptions = {
    from: `"WorkZen HRMS" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset your WorkZen Password',
    html: `
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #A24689; margin: 0;">WorkZen HRMS</h2>
          </div>
          
          <h3 style="color: #333; margin-bottom: 15px;">Password Reset Request</h3>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your password. Click the button below to reset it:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background-color: #A24689; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: 600;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 20px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #A24689; font-size: 14px; word-break: break-all;">
            ${resetLink}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 13px; margin: 5px 0;">
              ⏰ This link will expire in <strong>15 minutes</strong>
            </p>
            <p style="color: #999; font-size: 13px; margin: 5px 0;">
              🔒 If you didn't request this reset, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            © 2025 WorkZen HRMS. All rights reserved.
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', toEmail);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = { transporter, sendResetEmail };
