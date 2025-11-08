const { Resend } = require('resend');
require('dotenv').config();

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send password reset email via Resend
 * @param {string} toEmail - Recipient email address
 * @param {string} resetLink - Password reset link with token
 * @returns {Promise<object>} Resend API response
 * 
 * IMPORTANT: When using onboarding@resend.dev (testing domain):
 * - You can ONLY send to the email address you registered with Resend
 * - To send to any email, you must:
 *   1. Verify a custom domain at https://resend.com/domains
 *   2. Update FROM_EMAIL to use your domain (e.g., noreply@yourdomain.com)
 */
async function sendPasswordResetEmail(toEmail, resetLink) {
  // Use Resend's testing domain - onboarding@resend.dev
  // For production, verify your own domain and update this
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  
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

  try {
    // Send email using Resend API (official docs format)
    const { data, error } = await resend.emails.send({
      from: 'WorkZen <onboarding@resend.dev>', // Format: "Name <email@domain.com>"
      to: [toEmail], // Array of recipient emails
      subject: '🔐 Reset Your WorkZen Password',
      html: htmlContent,
    });

    // Resend API returns { data, error } - check for errors first
    if (error) {
      console.error('❌ Resend API error:', error);
      
      // Provide helpful guidance for common errors
      if (error.statusCode === 403 && error.message.includes('testing emails')) {
        throw new Error(
          `Resend Testing Limitation: Using onboarding@resend.dev, you can only send to your registered email. ` +
          `To send to any email address, verify a custom domain at https://resend.com/domains`
        );
      }
      
      throw new Error(error.message || 'Failed to send email via Resend');
    }

    console.log(`✅ Password reset email sent to ${toEmail} | Email ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    throw error;
  }
}

module.exports = { resend, sendPasswordResetEmail };
