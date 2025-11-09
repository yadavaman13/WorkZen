const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendEmailViaGmail } = require('../config/gmail');
const { generateEmployeeId } = require('../utils/generateEmployeeId');

async function getProfileCompletion(req, res) {
  try {
    // req.user is the full user loaded in authMiddleware
    const fields = ['company_name', 'name', 'email', 'phone'];
    const filled = fields.filter((f) => req.user[f]).length;
    const completion = Math.floor((filled / fields.length) * 100);
    // update in DB for convenience
    await db('users').where({ id: req.user.id }).update({ profile_completion: completion });
    return res.json({ completion });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

async function getMe(req, res) {
  try {
    const user = await db('users').where({ id: req.user.id }).first().select('id', 'employee_id', 'company_name', 'name', 'email', 'phone', 'role', 'status', 'profile_completion');
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

async function createEmployee(req, res) {
  try {
    const { email, name, phone, role } = req.body;

    // Validate required fields
    if (!email || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and name are required' 
      });
    }

    // Check if email already exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'An employee with this email already exists' 
      });
    }

    // Generate employee_id using company-based format
    // Get company name from the HR user who is creating this employee
    const hrUser = await db('users').where({ id: req.user.id }).first();
    const companyName = hrUser?.company_name || 'WorkZen';
    
    // Generate employee ID: [COMPANY_INITIALS][NAME_INITIALS][YEAR][SERIAL]
    const employeeId = await generateEmployeeId(companyName, name);

    // Generate a temporary password (will be reset via email)
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user account (only with existing DB columns)
    const [newUser] = await db('users').insert({
      employee_id: employeeId,
      email,
      name,
      password: hashedPassword,
      role: role || 'employee',
      phone: phone || null,
      status: 'active',
      company_name: companyName,
      profile_completion: 50,
      created_at: new Date()
    }).returning('*');

    // Store password reset token
    await db('password_resets').insert({
      email,
      token: resetToken,
      expires_at: resetTokenExpiry,
      created_at: new Date()
    });

    // Generate password reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send password reset email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #A24689; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background-color: #A24689; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .info-box { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to WorkZen HRMS!</h1>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            
            <p>Congratulations! Your employee account has been created successfully. We're excited to have you join our team.</p>
            
            <div class="info-box">
              <strong>Your Account Details:</strong><br/>
              <strong>Employee ID:</strong> ${employeeId}<br/>
              <strong>Email:</strong> ${email}<br/>
              <strong>Role:</strong> ${role || 'employee'}
            </div>
            
            <p>To get started, please set your password by clicking the button below:</p>
            
            <center>
              <a href="${resetLink}" class="button">Set Your Password</a>
            </center>
            
            <p style="color: #666; font-size: 14px;">
              This link will expire in 24 hours. If you didn't receive this email or have any questions, 
              please contact your HR department.
            </p>
            
            <p>Best regards,<br/>
            <strong>WorkZen HR Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmailViaGmail(
        email,
        'Welcome to WorkZen - Set Your Password',
        emailHtml
      );
      
      console.log(`✅ Employee ${employeeId} created and password reset email sent to ${email}`);
      
      return res.status(201).json({
        success: true,
        message: 'Employee account created successfully and password reset email sent',
        employee: {
          id: newUser.id,
          employee_id: employeeId,
          email,
          name,
          role: newUser.role
        }
      });
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError);
      
      // Account was created but email failed
      return res.status(201).json({
        success: true,
        message: 'Employee account created but failed to send email. Please contact IT support.',
        employee: {
          id: newUser.id,
          employee_id: employeeId,
          email,
          name,
          role: newUser.role
        },
        emailError: true
      });
    }
  } catch (err) {
    console.error('❌ Error creating employee:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    return res.status(500).json({ 
      success: false, 
      message: err.message || 'Server error while creating employee account',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
    });
  }
}

async function getAllEmployees(req, res) {
  try {
    // Fetch all users except the current user (HR), ordered by creation date
    const employees = await db('users')
      .where('id', '!=', req.user.id)
      .select(
        'id',
        'employee_id',
        'name',
        'email',
        'phone',
        'role',
        'status',
        'company_name',
        'profile_completion',
        'created_at'
      )
      .orderBy('created_at', 'desc');

    return res.json({
      success: true,
      employees,
      count: employees.length
    });
  } catch (err) {
    console.error('❌ Error fetching employees:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching employees'
    });
  }
}

module.exports = { getProfileCompletion, getMe, createEmployee, getAllEmployees };
