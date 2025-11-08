/**
 * Email Templates for OTP Verification
 * Professional HTML email templates using WorkZen branding
 */

const BRAND_COLOR = '#A24689';
const BRAND_NAME = 'WorkZen';

/**
 * OTP Verification Email Template
 * @param {string} name - User's name
 * @param {string} otp - 6-digit OTP code
 * @param {number} expiryMinutes - Minutes until OTP expires
 * @returns {string} - HTML email content
 */
const otpVerificationTemplate = (name, otp, expiryMinutes = 10) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - ${BRAND_NAME}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #8a3a73 100%); border-radius: 12px 12px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">${BRAND_NAME}</h1>
                  <p style="margin: 10px 0 0; color: #f0e0ec; font-size: 14px; letter-spacing: 1px;">HRMS</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Verify Your Email Address</h2>
                  
                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                    Hi <strong style="color: ${BRAND_COLOR};">${name}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                    Thank you for registering with ${BRAND_NAME}! To complete your registration and activate your account, please verify your email address using the OTP code below.
                  </p>
                  
                  <!-- OTP Box -->
                  <div style="background: linear-gradient(135deg, #f8f0f5 0%, #f3e8f0 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; border: 2px dashed ${BRAND_COLOR};">
                    <p style="margin: 0 0 15px; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Verification Code</p>
                    <div style="font-size: 48px; font-weight: 700; color: ${BRAND_COLOR}; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                      ${otp}
                    </div>
                    <p style="margin: 15px 0 0; color: #999999; font-size: 13px;">
                      <strong>Valid for ${expiryMinutes} minutes</strong>
                    </p>
                  </div>
                  
                  <p style="margin: 30px 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                    Enter this code on the verification page to activate your account and get started with ${BRAND_NAME}.
                  </p>
                  
                  <!-- Security Notice -->
                  <div style="margin: 30px 0 0; padding: 20px; background-color: #fff8e6; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <p style="margin: 0 0 10px; color: #856404; font-size: 14px; font-weight: 600;">
                      🔒 Security Tips
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 13px; line-height: 1.6;">
                      <li>Never share this code with anyone</li>
                      <li>This code expires in ${expiryMinutes} minutes</li>
                      <li>If you didn't request this, please ignore this email</li>
                    </ul>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 12px 12px; border-top: 1px solid #eeeeee;">
                  <p style="margin: 0 0 10px; color: #999999; font-size: 12px; text-align: center;">
                    This is an automated message from ${BRAND_NAME} HRMS.
                  </p>
                  <p style="margin: 0; color: #cccccc; font-size: 11px; text-align: center;">
                    © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
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
};

/**
 * Welcome Email Template (sent after successful verification)
 * @param {string} name - User's name
 * @param {string} dashboardUrl - URL to dashboard
 * @returns {string} - HTML email content
 */
const welcomeEmailTemplate = (name, dashboardUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${BRAND_NAME}!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #8a3a73 100%); border-radius: 12px 12px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">${BRAND_NAME}</h1>
                  <p style="margin: 10px 0 0; color: #f0e0ec; font-size: 14px; letter-spacing: 1px;">HRMS</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 64px;">🎉</div>
                  </div>
                  
                  <h2 style="margin: 0 0 20px; color: #333333; font-size: 28px; font-weight: 600; text-align: center;">Welcome to ${BRAND_NAME}!</h2>
                  
                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                    Hi <strong style="color: ${BRAND_COLOR};">${name}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                    Your email has been successfully verified, and your ${BRAND_NAME} account is now active! We're excited to have you on board.
                  </p>
                  
                  <!-- CTA Button -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 40px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(162, 70, 137, 0.3);">
                          Go to Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                    Get started by exploring your dashboard and setting up your profile.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 12px 12px; border-top: 1px solid #eeeeee;">
                  <p style="margin: 0 0 10px; color: #999999; font-size: 12px; text-align: center;">
                    Need help? Contact us at support@workzen.com
                  </p>
                  <p style="margin: 0; color: #cccccc; font-size: 11px; text-align: center;">
                    © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
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
};

module.exports = {
  otpVerificationTemplate,
  welcomeEmailTemplate
};
