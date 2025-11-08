/**
 * Email Templates for OTP Verification
 * Professional HTML templates for OTP and verification emails
 */

/**
 * OTP Email Template for Registration
 * @param {string} name - User's name
 * @param {string} otp - 6-digit OTP
 * @param {number} expiryMinutes - OTP validity in minutes
 * @returns {string} HTML email template
 */
export const otpEmailTemplate = (name, otp, expiryMinutes = 10) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - WorkZen HRMS</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔐 Email Verification</h1>
                  <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">WorkZen HRMS</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>
                  
                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #666; line-height: 1.6;">
                    Thank you for registering with WorkZen HRMS! To complete your registration and activate your account, please use the verification code below:
                  </p>
                  
                  <!-- OTP Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 20px; display: inline-block;">
                          <p style="margin: 0; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                          <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 42px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 20px 0; font-size: 14px; color: #666; line-height: 1.6;">
                    Enter this code in the verification page to activate your account. This code will expire in <strong>${expiryMinutes} minutes</strong>.
                  </p>
                  
                  <!-- Warning Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
                        <p style="margin: 0; color: #856404; font-size: 13px;">
                          <strong>⚠️ Security Notice:</strong> Never share this code with anyone. WorkZen staff will never ask for your verification code.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 20px 0 0 0; font-size: 13px; color: #999;">
                    If you didn't request this code, please ignore this email or contact support if you have concerns.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f0f0f0; padding: 20px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #666;">© ${new Date().getFullYear()} WorkZen HRMS. All rights reserved.</p>
                  <p style="margin: 5px 0 0 0; font-size: 11px; color: #999;">This is an automated message. Please do not reply to this email.</p>
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
 * OTP Resend Email Template
 * @param {string} name - User's name
 * @param {string} otp - 6-digit OTP
 * @param {number} expiryMinutes - OTP validity in minutes
 * @returns {string} HTML email template
 */
export const otpResendTemplate = (name, otp, expiryMinutes = 10) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>New Verification Code - WorkZen HRMS</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden;">
              
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔄 New Verification Code</h1>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>
                  
                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">
                    You requested a new verification code. Here's your new code:
                  </p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 20px;">
                          <p style="margin: 0; color: #ffffff; font-size: 42px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 20px 0; font-size: 14px; color: #666;">
                    This code expires in <strong>${expiryMinutes} minutes</strong>.
                  </p>
                </td>
              </tr>
              
              <tr>
                <td style="background-color: #f0f0f0; padding: 20px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #666;">© ${new Date().getFullYear()} WorkZen HRMS</p>
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
 * Account Activated Email Template
 * @param {string} name - User's name
 * @param {string} loginUrl - URL to login page
 * @returns {string} HTML email template
 */
export const accountActivatedTemplate = (name, loginUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Account Activated - WorkZen HRMS</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px;">
              
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0;">✅ Account Activated!</h1>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 40px;">
                  <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>
                  
                  <p style="font-size: 14px; color: #666; line-height: 1.6;">
                    Congratulations! Your WorkZen HRMS account has been successfully activated. You can now log in and access all features.
                  </p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${loginUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                          ➜ Login Now
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <tr>
                <td style="background-color: #f0f0f0; padding: 20px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #666;">© ${new Date().getFullYear()} WorkZen HRMS</p>
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
