const { Resend } = require('resend');
const { sendEmailViaGmail } = require('./gmail');
require('dotenv').config();

// Initialize Resend client with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Check if Gmail SMTP should be used
const useGmailSMTP = process.env.USE_GMAIL_SMTP === 'true';

console.log(`📧 Email Service: ${useGmailSMTP ? 'Gmail SMTP' : 'Resend'} ${useGmailSMTP ? '(Works for ALL emails!)' : ''}`);

/**
 * Send email using configured service (Gmail or Resend)
 * @param {string} toEmail - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML email body
 * @returns {Promise<object>} Email service response
 */
async function sendEmail(toEmail, subject, htmlContent) {
  if (useGmailSMTP) {
    // Use Gmail SMTP (works for all emails)
    return await sendEmailViaGmail(toEmail, subject, htmlContent);
  } else {
    // Use Resend (requires verified domain for all emails)
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    
    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject: subject,
        html: htmlContent
      });
      
      if (error) {
        console.error('❌ Resend API Error:', error);
        throw new Error(error.message || 'Failed to send email');
      }
      
      console.log('✅ Resend email sent successfully:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Email Send Error:', error.message);
      throw error;
    }
  }
}

/**
 * Send password reset email via Resend (Official Documentation Format)
 * @param {string} toEmail - Recipient email address
 * @param {string} resetLink - Password reset link with token
 * @returns {Promise<object>} Resend API response with email ID
 * 
 * Usage follows official Resend docs:
 * - Uses onboarding@resend.dev for testing (can send to registered email only)
 * - For production: Verify custom domain at https://resend.com/domains
 */
async function sendPasswordResetEmail(toEmail, resetLink) {
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  
  // HTML email template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your WorkZen Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #A24689 0%, #8a3a73 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">WorkZen HRMS</h1>
                  <p style="margin: 10px 0 0; color: #f0e0ec; font-size: 14px;">Human Resource Management System</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
                  
                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                    We received a request to reset the password for your WorkZen account associated with <strong style="color: #A24689;">${toEmail}</strong>.
                  </p>
                  
                  <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                    Click the button below to create a new password. This link will expire in <strong>15 minutes</strong> for security reasons.
                  </p>
                  
                  <!-- Reset Button -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background-color: #A24689; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(162, 70, 137, 0.2);">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 20px; color: #999999; font-size: 14px; line-height: 1.6;">
                    Or copy and paste this link into your browser:
                  </p>
                  
                  <p style="margin: 0 0 30px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #A24689; color: #666666; font-size: 13px; word-break: break-all; border-radius: 4px;">
                    ${resetLink}
                  </p>
                  
                  <!-- Security Notice -->
                  <div style="margin: 30px 0 0; padding: 20px; background-color: #fff8e6; border-radius: 6px; border-left: 4px solid #ffc107;">
                    <p style="margin: 0 0 10px; color: #856404; font-size: 14px; font-weight: 600;">
                      🔒 Security Notice
                    </p>
                    <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.6;">
                      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; border-top: 1px solid #eeeeee;">
                  <p style="margin: 0 0 10px; color: #999999; font-size: 12px; text-align: center;">
                    This is an automated message from WorkZen HRMS.
                  </p>
                  <p style="margin: 0; color: #cccccc; font-size: 11px; text-align: center;">
                    © 2025 WorkZen. All rights reserved.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendEmail(toEmail, '🔐 Reset Your WorkZen Password', htmlContent);
}

/**
 * Send OTP verification email (uses configured service)
 * @param {string} toEmail - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML email body
 * @returns {Promise<object>} Email service response
 */
async function sendOtpEmail(toEmail, subject, htmlContent) {
  return await sendEmail(toEmail, subject, htmlContent);
}

module.exports = { resend, sendPasswordResetEmail, sendOtpEmail, sendEmail };

