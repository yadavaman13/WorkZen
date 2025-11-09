import nodemailer from 'nodemailer';
import logger from './logger.js';

/**
 * Create Gmail SMTP transporter
 * Uses Gmail App Password for authentication
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Send email using Gmail SMTP
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML email body
 * @param {string} textContent - Plain text fallback (optional)
 * @returns {Promise} Email send result
 */
export const sendEmail = async (to, subject, htmlContent, textContent = '') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"WorkZen HRMS" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, '')
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`✅ Email sent via Gmail SMTP to ${to}:`, result.messageId);
    return result;
  } catch (error) {
    logger.error('❌ Gmail SMTP failed:', {
      to,
      subject,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export const sendOnboardingInvite = async (email, name, inviteLink) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1>Welcome to WorkZen!</h1>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <p>Dear ${name},</p>
        <p>Welcome to our organization! We're excited to have you on board.</p>
        <p>Please complete your onboarding by clicking the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" 
             style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Complete Onboarding
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">This link expires in 7 days.</p>
      </div>
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        <p>WorkZen HRMS | ${new Date().getFullYear()}</p>
      </div>
    </div>
  `;
  
  return sendEmail(email, '👋 Welcome to WorkZen - Complete Your Onboarding', htmlContent);
};

export const sendApprovalNotification = async (email, employeeId, temporaryPassword) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1>✅ Onboarding Approved!</h1>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <p>Congratulations! Your onboarding has been approved.</p>
        <table style="width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; background: white; border: 1px solid #ddd;">Employee ID:</td>
            <td style="padding: 10px; background: white; border: 1px solid #ddd; font-weight: bold;">${employeeId}</td>
          </tr>
          <tr>
            <td style="padding: 10px; background: white; border: 1px solid #ddd;">Email:</td>
            <td style="padding: 10px; background: white; border: 1px solid #ddd; font-weight: bold;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 10px; background: white; border: 1px solid #ddd;">Temporary Password:</td>
            <td style="padding: 10px; background: white; border: 1px solid #ddd; font-family: monospace; font-weight: bold;">${temporaryPassword}</td>
          </tr>
        </table>
        <p style="color: #e74c3c;">⚠️ Please change your password on first login.</p>
      </div>
    </div>
  `;
  
  return sendEmail(email, '✅ Welcome Aboard! Your Account is Ready', htmlContent);
};

export const sendRevisionRequest = async (email, reason) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #fff3cd; color: #856404; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1>⚠️ Changes Requested</h1>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <p>Your onboarding submission requires the following changes:</p>
        <p style="background: white; padding: 15px; border-left: 4px solid #f39c12; margin: 20px 0;">
          ${reason}
        </p>
        <p>Please make the necessary changes and resubmit your application.</p>
      </div>
    </div>
  `;
  
  return sendEmail(email, 'Changes Required - Onboarding', htmlContent);
};

export const sendRejectionNotification = async (email, reason) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f8d7da; color: #721c24; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1>❌ Application Status</h1>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <p>We regret to inform you that your onboarding application has been rejected.</p>
        <p style="background: white; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
          ${reason}
        </p>
        <p>If you have any questions, please contact our HR department.</p>
      </div>
    </div>
  `;
  
  return sendEmail(email, 'Application Status Update', htmlContent);
};

/**
 * Send welcome email with credentials and login instructions
 */
export const sendWelcomeWithCredentials = async (email, fullName, temporaryPassword, loginUrl = 'http://localhost:5173') => {
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; line-height: 1.6;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to WorkZen!</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your account has been created</p>
      </div>
      
      <div style="padding: 40px; background-color: #f8f9fa; border: 1px solid #dee2e6;">
        <p style="margin-top: 0;">Hi <strong>${fullName}</strong>,</p>
        
        <p>Your WorkZen HRMS account has been successfully created! Below are your login credentials.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 2px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">📋 Your Login Credentials</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0; font-weight: bold; width: 40%; color: #333;">Email:</td>
              <td style="padding: 12px 0; font-family: 'Courier New', monospace; color: #667eea;"><strong>${email}</strong></td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0; font-weight: bold; color: #333;">Temporary Password:</td>
              <td style="padding: 12px 0; font-family: 'Courier New', monospace; background: #f0f0f0; padding: 8px; border-radius: 4px; color: #e74c3c;"><strong>${temporaryPassword}</strong></td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
            ➜ Go to Login
          </a>
        </div>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404;">
            <strong>⚠️ Important:</strong> Change your password immediately after your first login. Never share your credentials with anyone.
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          <strong>Need help?</strong> Contact our support team at <a href="mailto:support@workzen.com" style="color: #667eea; text-decoration: none;">support@workzen.com</a>
        </p>
      </div>
      
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} WorkZen HRMS. All rights reserved.</p>
        <p style="margin: 5px 0 0 0; font-size: 11px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;
  
  return sendEmail(email, `🎉 Welcome to WorkZen, ${fullName}! Here are your login credentials`, htmlContent);
};

/**
 * Send password reset link to user
 */
export const sendPasswordResetLink = async (email, resetLink, expiryHours = 24) => {
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; line-height: 1.6;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🔐 Password Reset</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Click the link below to reset your password</p>
      </div>
      
      <div style="padding: 40px; background-color: #f8f9fa; border: 1px solid #dee2e6;">
        <p>You requested a password reset for your WorkZen account.</p>
        
        <p style="color: #666; font-size: 14px;">Click the button below to reset your password. This link will expire in <strong>${expiryHours} hours</strong>.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
            🔐 Reset Password
          </a>
        </div>
        
        <p style="color: #666; font-size: 13px; word-break: break-all;">
          Or copy this link:<br/>
          <code style="background: white; padding: 10px; display: block; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px;">${resetLink}</code>
        </p>
        
        <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #721c24;">
            <strong>⚠️ If you didn't request this:</strong> Please ignore this email or contact support immediately. Your account may be at risk.
          </p>
        </div>
      </div>
      
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} WorkZen HRMS. All rights reserved.</p>
        <p style="margin: 5px 0 0 0; font-size: 11px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;
  
  return sendEmail(email, '🔐 Password Reset Request - WorkZen HRMS', htmlContent);
};

/**
 * Send bulk credentials to newly created users
 */
export const sendBulkCredentials = async (users) => {
  const results = {
    sent: [],
    failed: []
  };
  
  for (const user of users) {
    try {
      await sendWelcomeWithCredentials(user.email, user.full_name, user.temporaryPassword);
      results.sent.push({ email: user.email, status: 'sent' });
      logger.info(`Credentials sent to ${user.email}`);
    } catch (error) {
      results.failed.push({ email: user.email, error: error.message });
      logger.error(`Failed to send credentials to ${user.email}:`, error.message);
    }
  }
  
  return results;
};

/**
 * Send email to HR for approval notifications
 */
export const sendHRNotification = async (hrEmail, candidateName, candidateEmail, approvalLink) => {
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; line-height: 1.6;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">📋 New Onboarding Request</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Action required</p>
      </div>
      
      <div style="padding: 40px; background-color: #f8f9fa; border: 1px solid #dee2e6;">
        <p>A new onboarding request requires your review and approval.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 2px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">👤 Candidate Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0; font-weight: bold; width: 40%; color: #333;">Name:</td>
              <td style="padding: 12px 0; color: #667eea;"><strong>${candidateName}</strong></td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0; font-weight: bold; color: #333;">Email:</td>
              <td style="padding: 12px 0; color: #667eea;"><strong>${candidateEmail}</strong></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: bold; color: #333;">Submission Time:</td>
              <td style="padding: 12px 0; color: #667eea;"><strong>${new Date().toLocaleString()}</strong></td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${approvalLink}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
            ➜ Review Application
          </a>
        </div>
      </div>
      
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} WorkZen HRMS. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return sendEmail(hrEmail, `📋 New Onboarding Request from ${candidateName}`, htmlContent);
};
