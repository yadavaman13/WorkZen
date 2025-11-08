const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const generateToken = require('../utils/generateToken');
const { generateEmployeeId } = require('../utils/generateEmployeeId');
const { generateToken: generateResetToken, generateTokenExpiry } = require('../utils/tokenUtil');
const { sendPasswordResetEmail } = require('../config/resend');

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
    if (existing) return res.status(400).json({ msg: 'Email already in use' });
    
    // Generate employee ID
    const employeeId = await generateEmployeeId(companyName, name);
    
    const hashed = await hashPassword(password);
    const [user] = await db('users').insert({ 
      employee_id: employeeId,
      company_name: companyName,
      name, 
      email, 
      phone,
      password: hashed 
    }).returning(['id', 'employee_id', 'name', 'email', 'role', 'status', 'company_name', 'phone']);
    
    // log
    await db('audit_logs').insert({ actor_id: user.id, action: 'User registered', target_id: user.id });
    const token = generateToken(user);
    return res.json({ user, token, redirect: determineRedirect(user.role) });
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

module.exports = { register, login, requestPasswordReset, resetPassword };
