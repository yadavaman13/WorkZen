const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const generateToken = require('../utils/generateToken');
const { generateEmployeeId } = require('../utils/generateEmployeeId');
const { generateToken: generateResetToken, generateTokenExpiry } = require('../utils/tokenUtil');
const { sendPasswordResetEmail, sendOtpEmail } = require('../config/resend');
const { generateOtp, hashOtp, compareOtp, generateOtpExpiry } = require('../utils/otpUtil');
const { otpVerificationTemplate, welcomeEmailTemplate } = require('../utils/mailTemplates');

async function register(req, res) {
  try {
    const { companyName, name, email, phone, password } = req.body;
    
    // Validation
    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ msg: 'Company name is required' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ msg: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ msg: 'Email is required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ msg: 'Invalid email format' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ msg: 'Phone number is required' });
    }
    if (!/^\d{10}$/.test(phone.replace(/[\s-]/g, ''))) {
      return res.status(400).json({ msg: 'Phone number must be 10 digits' });
    }
    if (!password) {
      return res.status(400).json({ msg: 'Password is required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }
    
    const existing = await db('users').where({ email }).first();
    if (existing) {
      if (existing.status === 'active') {
        return res.status(400).json({ msg: 'Email already registered and verified' });
      } else if (existing.status === 'pending') {
        return res.status(400).json({ msg: 'Email already registered. Please verify your OTP or request a new one.' });
      }
    }
    
    // Generate employee ID
    const employeeId = await generateEmployeeId(companyName, name);
    
    const hashed = await hashPassword(password);
    const [user] = await db('users').insert({ 
      employee_id: employeeId,
      company_name: companyName,
      name, 
      email, 
      phone,
      password: hashed,
      status: 'pending' // Set status to pending until OTP verification
    }).returning(['id', 'employee_id', 'name', 'email', 'role', 'status', 'company_name', 'phone']);
    
    // Generate OTP
    const otp = generateOtp(6); // 6-digit OTP
    const otpHash = await hashOtp(otp);
    const expiresAt = generateOtpExpiry(10); // 10 minutes expiry
    
    // Store OTP in database
    await db('email_otps').insert({
      email,
      otp_hash: otpHash,
      otp_plain: process.env.NODE_ENV === 'development' ? otp : null, // Only store plain in dev
      expires_at: expiresAt,
      used: false,
      attempts: 0
    });
    
    // Send OTP email
    try {
      const htmlContent = otpVerificationTemplate(name, otp, 10);
      await sendOtpEmail(email, 'Verify Your Email - WorkZen HRMS', htmlContent);
      console.log(`✅ OTP sent to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      // Clean up user and OTP if email fails
      await db('email_otps').where({ email }).delete();
      await db('users').where({ id: user.id }).delete();
      return res.status(500).json({ msg: 'Failed to send verification email. Please try again.' });
    }
    
    // Log audit
    await db('audit_logs').insert({ 
      actor_id: user.id, 
      action: 'User registered - pending OTP verification', 
      target_id: user.id 
    });
    
    return res.json({ 
      msg: 'Registration successful! Please check your email for the verification code.',
      email: email
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !email.trim()) {
      return res.status(400).json({ msg: 'Email is required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ msg: 'Invalid email format' });
    }
    if (!password) {
      return res.status(400).json({ msg: 'Password is required' });
    }
    
    const user = await db('users').where({ email }).first();
    if (!user) return res.status(401).json({ msg: 'Invalid credentials' });
    if (user.status === 'suspended') return res.status(403).json({ msg: 'Account suspended' });
    
    const ok = await comparePassword(password, user.password);
    if (!ok) return res.status(401).json({ msg: 'Invalid credentials' });
    
    const token = generateToken(user);
    await db('audit_logs').insert({ actor_id: user.id, action: 'User logged in', target_id: user.id });
    
    return res.json({ 
      user: { 
        id: user.id,
        employee_id: user.employee_id,
        name: user.name, 
        email: user.email, 
        role: user.role, 
        company_name: user.company_name,
        phone: user.phone 
      }, 
      token, 
      redirect: determineRedirect(user.role) 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

function determineRedirect(role) {
  if (role === 'admin') return '/dashboard/admin';
  if (role === 'hr') return '/dashboard/hr';
  if (role === 'payroll') return '/dashboard/payroll';
  return '/dashboard/employee';
}

// REQUEST PASSWORD RESET (Using Resend)
async function requestPasswordReset(req, res) {
  const { email } = req.body;

  try {
    // Validation
    if (!email || !email.trim()) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ msg: 'Invalid email format' });
    }

    // Check if user exists (but don't reveal this to prevent enumeration)
    const user = await db('users').where({ email }).first();
    
    // Always return success message for security (prevent email enumeration)
    if (!user) {
      console.log(` Password reset requested for non-existent email: ${email}`);
      return res.json({ 
        msg: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }

    // Generate secure random token (32 bytes = 64 hex chars)
    const token = generateResetToken(32);
    const expiresAt = generateTokenExpiry(15); // 15 minutes

    // Store token in database
    await db('password_resets').insert({
      email,
      token,
      expires_at: expiresAt,
      used: false
    });

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email via Resend (using official API format)
    try {
      const result = await sendPasswordResetEmail(email, resetLink);
      console.log(`✅ Password reset email sent successfully to ${email} | Email ID: ${result.id}`);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError.message);
      // Clean up the token since email couldn't be sent
      await db('password_resets').where({ token }).del();
      return res.status(500).json({ 
        msg: 'Failed to send reset email. Please try again later or contact support.' 
      });
    }

    // Log the action for audit
    await db('audit_logs').insert({
      actor_id: user.id,
      action: 'Password reset requested',
      target_id: user.id
    });

    console.log(`Password reset token generated for ${email} | Expires: ${expiresAt.toISOString()}`);

    return res.json({ 
      msg: 'If an account exists with this email, a password reset link has been sent.' 
    });
  } catch (err) {
    console.error('requestPasswordReset error:', err);
    return res.status(500).json({ msg: 'Server error. Please try again later.' });
  }
}

// RESET PASSWORD (Using Resend tokens)
async function resetPassword(req, res) {
  const { token, email, newPassword } = req.body;

  try {
    // Validation
    if (!token || !email || !newPassword) {
      return res.status(400).json({ msg: 'Token, email, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    // Find the most recent unused token for this email
    const resetRecord = await db('password_resets')
      .where({ email, token, used: false })
      .orderBy('created_at', 'desc')
      .first();

    if (!resetRecord) {
      console.log(`Invalid reset attempt for ${email} with token: ${token.substring(0, 10)}...`);
      return res.status(400).json({ msg: 'Invalid or expired reset link' });
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(resetRecord.expires_at);
    
    if (expiresAt < now) {
      const minutesExpired = Math.floor((now - expiresAt) / (1000 * 60));
      console.log(`Expired token used for ${email} | Expired ${minutesExpired} minutes ago`);
      return res.status(400).json({ 
        msg: 'Reset link has expired. Please request a new one.' 
      });
    }

    // Find user
    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db('users').where({ email }).update({ password: hashedPassword });

    // Mark token as used (single-use security)
    await db('password_resets').where({ id: resetRecord.id }).update({ used: true });

    // Clean up old used/expired tokens for this email
    await db('password_resets')
      .where({ email })
      .where(function() {
        this.where('used', true)
          .orWhere('expires_at', '<', now);
      })
      .whereNot('id', resetRecord.id)
      .del();

    // Log the action
    await db('audit_logs').insert({
      actor_id: user.id,
      action: 'Password reset completed successfully',
      target_id: user.id
    });

    console.log(`Password successfully reset for ${email}`);

    return res.json({ 
      msg: 'Password reset successful. Please log in with your new password.' 
    });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ msg: 'Server error. Please try again later.' });
  }
}

// Verify OTP after registration
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ msg: 'Email and OTP are required' });
    }
    
    // Find user
    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    if (user.status === 'active') {
      return res.status(400).json({ msg: 'Email already verified' });
    }
    
    // Find valid OTP
    const otpRecord = await db('email_otps')
      .where({ email, used: false })
      .where('expires_at', '>', new Date())
      .orderBy('created_at', 'desc')
      .first();
    
    if (!otpRecord) {
      return res.status(400).json({ msg: 'Invalid or expired OTP. Please request a new one.' });
    }
    
    // Check max attempts (3 attempts allowed)
    if (otpRecord.attempts >= 3) {
      await db('email_otps').where({ id: otpRecord.id }).update({ used: true });
      return res.status(400).json({ msg: 'Maximum OTP attempts exceeded. Please request a new OTP.' });
    }
    
    // Verify OTP
    const isValid = await compareOtp(otp, otpRecord.otp_hash);
    
    if (!isValid) {
      // Increment attempts
      await db('email_otps').where({ id: otpRecord.id }).increment('attempts', 1);
      const remainingAttempts = 3 - (otpRecord.attempts + 1);
      return res.status(400).json({ 
        msg: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.` 
      });
    }
    
    // Mark OTP as used
    await db('email_otps').where({ id: otpRecord.id }).update({ used: true });
    
    // Activate user
    await db('users').where({ email }).update({ status: 'active' });
    
    // Send welcome email
    try {
      const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5173/dashboard';
      const htmlContent = welcomeEmailTemplate(user.name, dashboardUrl);
      await sendOtpEmail(email, 'Welcome to WorkZen HRMS!', htmlContent);
      console.log(`✅ Welcome email sent to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Continue anyway - user is verified
    }
    
    // Log audit
    await db('audit_logs').insert({ 
      actor_id: user.id, 
      action: 'Email verified via OTP', 
      target_id: user.id 
    });
    
    // Get updated user
    const verifiedUser = await db('users')
      .where({ email })
      .first(['id', 'employee_id', 'name', 'email', 'role', 'status', 'company_name', 'phone']);
    
    // Generate token
    const token = generateToken(verifiedUser);
    
    return res.json({ 
      msg: 'Email verified successfully!',
      user: verifiedUser, 
      token, 
      redirect: determineRedirect(verifiedUser.role) 
    });
    
  } catch (err) {
    console.error('verifyOtp error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

// Resend OTP
async function resendOtp(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }
    
    // Find user
    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    if (user.status === 'active') {
      return res.status(400).json({ msg: 'Email already verified' });
    }
    
    // Check for recent OTP (rate limiting - prevent spam)
    const recentOtp = await db('email_otps')
      .where({ email })
      .where('created_at', '>', new Date(Date.now() - 60 * 1000)) // Last 60 seconds
      .first();
    
    if (recentOtp) {
      return res.status(429).json({ 
        msg: 'Please wait 60 seconds before requesting a new OTP' 
      });
    }
    
    // Mark all previous OTPs as used
    await db('email_otps').where({ email, used: false }).update({ used: true });
    
    // Generate new OTP
    const otp = generateOtp(6);
    const otpHash = await hashOtp(otp);
    const expiresAt = generateOtpExpiry(10); // 10 minutes
    
    // Store new OTP
    await db('email_otps').insert({
      email,
      otp_hash: otpHash,
      otp_plain: process.env.NODE_ENV === 'development' ? otp : null,
      expires_at: expiresAt,
      used: false,
      attempts: 0
    });
    
    // Send OTP email
    try {
      const htmlContent = otpVerificationTemplate(user.name, otp, 10);
      await sendOtpEmail(email, 'Verify Your Email - WorkZen HRMS', htmlContent);
      console.log(`✅ OTP resent to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to resend OTP email:', emailError);
      return res.status(500).json({ msg: 'Failed to send verification email. Please try again.' });
    }
    
    // Log audit
    await db('audit_logs').insert({ 
      actor_id: user.id, 
      action: 'OTP resent', 
      target_id: user.id 
    });
    
    return res.json({ 
      msg: 'New verification code sent to your email',
      email: email
    });
    
  } catch (err) {
    console.error('resendOtp error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = {
  register,
  login,
  requestPasswordReset,
  resetPassword,
  verifyOtp,
  resendOtp
};
