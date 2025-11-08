const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Gmail SMTP Transporter
 * Configured to send emails via Gmail SMTP
 * Works for ALL email addresses (no domain restrictions)
 */
const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send email via Gmail SMTP
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email content
 * @returns {Promise<object>} - Email send result
 */
async function sendEmailViaGmail(to, subject, html) {
  try {
    const info = await gmailTransporter.sendMail({
      from: `"WorkZen HRMS" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html
    });
    
    console.log(`✅ Gmail email sent successfully to ${to}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Gmail SMTP Error:', error.message);
    throw error;
  }
}

/**
 * Verify Gmail SMTP connection
 */
async function verifyGmailConnection() {
  try {
    await gmailTransporter.verify();
    console.log('✅ Gmail SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Gmail SMTP connection failed:', error.message);
    return false;
  }
}

module.exports = {
  sendEmailViaGmail,
  verifyGmailConnection
};
