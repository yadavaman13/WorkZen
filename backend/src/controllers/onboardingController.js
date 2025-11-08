import crypto from 'crypto';
import moment from 'moment';
import path from 'path';
import fs from 'fs';
import bcryptjs from 'bcryptjs';
import { sendEmail, sendOnboardingInvite } from '../utils/emailService.js';
import Onboarding from '../models/Onboarding.js';
import db from '../config/database.js';

// 1. HR initiates onboarding invite
export const createOnboardingInvite = async (req, res) => {
  try {
    const { candidate_email, candidate_name, department, position, joining_date } = req.body;
    const token = crypto.randomBytes(32).toString('hex');

    const onboarding = await Onboarding.create({
      candidate_email,
      candidate_name,
      department,
      position,
      joining_date,
      token,
      status: 'invited',
      created_by: req.user.id
    });

    // Fix: Use query parameter for token instead of path parameter
    const inviteLink = `${process.env.FRONTEND_URL}/onboard?token=${token}`;
    
    // Use the professional email template
    await sendOnboardingInvite(candidate_email, candidate_name, inviteLink);

    res.status(201).json({ 
      message: 'Onboarding invite created successfully', 
      onboarding,
      note: 'Email sent to ' + candidate_email
    });
  } catch (error) {
    console.error('Onboarding invite error:', error);
    res.status(500).json({ error: error.message });
  }
};

// 2. Validate onboarding token
export const validateToken = async (req, res) => {
  try {
    const { token } = req.params;
    const onboarding = await Onboarding.findByToken(token);

    if (!onboarding) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }

    const createdDate = moment(onboarding.created_at);
    const expiryDate = createdDate.add(7, 'days');
    
    if (moment().isAfter(expiryDate)) {
      return res.status(400).json({ error: 'Token has expired' });
    }

    if (onboarding.status === 'completed' || onboarding.status === 'approved') {
      return res.status(400).json({ error: 'Onboarding already completed' });
    }

    res.json({ valid: true, onboarding: { candidate_name: onboarding.candidate_name, department: onboarding.department, position: onboarding.position, status: onboarding.status } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Save personal information
export const savePersonalInfo = async (req, res) => {
  try {
    const { token } = req.params;
    const personalData = req.body;
    const onboarding = await Onboarding.findByToken(token);

    if (!onboarding) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    // Check for duplicate PAN
    if (personalData.pan_number) {
      const duplicatePAN = await Onboarding.checkDuplicatePAN(personalData.pan_number, onboarding.id);
      if (duplicatePAN) {
        return res.status(400).json({ error: 'PAN number already exists' });
      }
    }

    // Check for duplicate Aadhaar
    if (personalData.aadhaar_number) {
      const duplicateAadhaar = await Onboarding.checkDuplicateAadhaar(personalData.aadhaar_number, onboarding.id);
      if (duplicateAadhaar) {
        return res.status(400).json({ error: 'Aadhaar number already exists' });
      }
    }

    // Store personal info in JSONB, and PAN/Aadhaar in dedicated columns
    const updateData = {
      personal_info: {
        full_name: personalData.full_name,
        dob: personalData.dob,
        contact_number: personalData.contact_number,
        address: personalData.address,
        city: personalData.city,
        state: personalData.state,
        pincode: personalData.pincode
      },
      pan: personalData.pan_number,
      aadhaar: personalData.aadhaar_number,
      step_completed: Math.max(onboarding.step_completed || 0, 1)
    };

    await Onboarding.update(onboarding.id, updateData);
    res.json({ message: 'Personal information saved successfully', step_completed: 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Save bank information
export const saveBankInfo = async (req, res) => {
  try {
    const { token } = req.params;
    const bankData = req.body;
    const onboarding = await Onboarding.findByToken(token);

    if (!onboarding) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    const encryptionService = await import('../utils/encryptionService.js');
    const encryptedBankData = { ...bankData, account_number: encryptionService.encrypt(bankData.account_number), ifsc_code: bankData.ifsc_code };

    await Onboarding.update(onboarding.id, { bank_info: encryptedBankData, step_completed: Math.max(onboarding.step_completed || 0, 2) });
    res.json({ message: 'Bank information saved successfully', step_completed: 2 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Upload documents
export const uploadDocuments = async (req, res) => {
  try {
    const { token } = req.params;
    const files = req.files;
    const onboarding = await Onboarding.findByToken(token);

    if (!onboarding) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    const documentPaths = {};
    for (const [key, file] of Object.entries(files)) {
      documentPaths[key] = file.path;
    }

    await Onboarding.update(onboarding.id, { documents: documentPaths, step_completed: Math.max(onboarding.step_completed || 0, 3) });
    res.json({ message: 'Documents uploaded successfully', step_completed: 3, documents: documentPaths });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 6. Extract OCR data
export const extractOCR = async (req, res) => {
  try {
    const { token, document_type } = req.params;
    const onboarding = await Onboarding.findByToken(token);

    if (!onboarding || !onboarding.documents || !onboarding.documents[document_type]) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentPath = onboarding.documents[document_type];
    const ocrProcessor = await import('../utils/ocrProcessor.js');
    const extractedData = await ocrProcessor.processDocument(documentPath, document_type);

    res.json({ message: 'OCR extraction successful', data: extractedData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 7. Submit onboarding
export const submitOnboarding = async (req, res) => {
  try {
    const { token } = req.params;
    const onboarding = await Onboarding.findByToken(token);

    if (!onboarding) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    // Check if all required steps are completed
    if (!onboarding.personal_info || !onboarding.bank_info) {
      return res.status(400).json({ error: 'Please complete all steps' });
    }

    // Check if PAN and Aadhaar are provided
    if (!onboarding.pan || !onboarding.aadhaar) {
      return res.status(400).json({ error: 'Please provide PAN and Aadhaar details' });
    }

    await Onboarding.update(onboarding.id, { status: 'pending_review', step_completed: 4, submitted_at: new Date() });
    res.json({ message: 'Onboarding submitted successfully', status: 'pending_review' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 8. Get pending reviews
export const getPendingReviews = async (req, res) => {
  try {
    const pendingOnboardings = await Onboarding.findPending();
    res.json({ count: pendingOnboardings.length, onboardings: pendingOnboardings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 9. Approve onboarding
export const approveOnboarding = async (req, res) => {
  try {
    const { onboarding_id } = req.params;
    const onboarding = await Onboarding.findById(onboarding_id);

    if (!onboarding) {
      return res.status(404).json({ error: 'Onboarding request not found' });
    }

    // Check if already approved
    if (onboarding.status === 'approved') {
      return res.status(400).json({ error: 'Onboarding already approved' });
    }

    // Check if user already exists
    const existingUser = await db('users').where('email', onboarding.candidate_email).first();
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User account already exists for this email. Please contact admin.' 
      });
    }

    // Auto-generate employee ID
    const { generateEmployeeId } = await import('../utils/employeeIdGenerator.js');
    const employee_id = await generateEmployeeId();

    // Generate random secure password
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1@'; // Simple random password
    const hashedPassword = await bcryptjs.hash(tempPassword, 10);

    // Extract name from personal_info
    const fullName = onboarding.personal_info?.full_name || onboarding.candidate_name;
    const nameParts = fullName.split(' ');
    const first_name = nameParts[0] || fullName;
    const last_name = nameParts.slice(1).join(' ') || '';

    // Create user account first
    const [userRecord] = await db('users').insert({
      email: onboarding.candidate_email,
      password: hashedPassword,
      first_name,
      last_name,
      role: 'employee',
      is_active: true,
      email_verified: true
    }).returning('*');

    // Create employee record with correct user_id
    const [employeeRecord] = await db('employees').insert({
      user_id: userRecord.id,
      employee_id,
      first_name,
      last_name,
      email: onboarding.candidate_email,
      phone: onboarding.personal_info?.contact_number,
      department: onboarding.department,
      position: onboarding.position,
      date_of_joining: onboarding.joining_date,
      employment_status: 'active'
    }).returning('*');

    // Update onboarding status
    await Onboarding.update(onboarding_id, {
      status: 'approved',
      approved_by: req.user.id,
      approved_at: new Date(),
      linked_employee_id: employeeRecord.id
    });

    // Send welcome email with credentials
    const emailService = await import('../utils/emailService.js');
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎉 Welcome to WorkZen!</h2>
        <p>Dear ${fullName},</p>
        <p>Congratulations! Your onboarding has been approved. You can now access your WorkZen account.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Your Login Credentials:</h3>
          <p><strong>Employee ID:</strong> ${employee_id}</p>
          <p><strong>Email:</strong> ${onboarding.candidate_email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        </div>

        <p style="color: #dc2626;"><strong>⚠️ Important:</strong> Please change your password after your first login.</p>
        
        <p>Login at: <a href="${process.env.FRONTEND_URL}/login" style="color: #2563eb;">${process.env.FRONTEND_URL}/login</a></p>
        
        <p>Department: ${onboarding.department}</p>
        <p>Position: ${onboarding.position}</p>
        <p>Joining Date: ${new Date(onboarding.joining_date).toLocaleDateString()}</p>
        
        <p style="margin-top: 30px;">Best regards,<br/>WorkZen HR Team</p>
      </div>
    `;

    await emailService.sendEmail(
      onboarding.candidate_email,
      '🎉 Welcome to WorkZen - Your Account is Ready!',
      emailHtml
    );

    res.json({
      message: 'Onboarding approved successfully',
      employee_id,
      email_sent: true
    });
  } catch (error) {
    console.error('Approve onboarding error:', error);
    res.status(500).json({ error: error.message });
  }
};

// 10. Request changes
export const requestChanges = async (req, res) => {
  try {
    const { onboarding_id } = req.params;
    const { comments, fields_to_change } = req.body;
    const onboarding = await Onboarding.findById(onboarding_id);

    if (!onboarding) {
      return res.status(404).json({ error: 'Onboarding request not found' });
    }

    // Update onboarding status
    await Onboarding.update(onboarding_id, { 
      status: 'changes_requested', 
      review_comments: comments, 
      fields_to_change 
    });

    // Send email with change request link
    const emailService = await import('../utils/emailService.js');
    const changeLink = `${process.env.FRONTEND_URL}/onboard?token=${onboarding.token}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">📝 Changes Requested for Your Onboarding</h2>
        <p>Dear ${onboarding.candidate_name},</p>
        <p>Our HR team has reviewed your onboarding submission and requested some changes.</p>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">Comments from HR:</h3>
          <p style="color: #78350f; white-space: pre-wrap;">${comments}</p>
        </div>

        <p>Please review the comments and update your information accordingly.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${changeLink}" 
             style="display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Update Your Information
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${changeLink}" style="color: #2563eb;">${changeLink}</a>
        </p>
        
        <p style="margin-top: 30px;">Best regards,<br/>WorkZen HR Team</p>
      </div>
    `;

    await emailService.sendEmail(
      onboarding.candidate_email,
      '📝 Changes Requested - Update Your Onboarding Information',
      emailHtml
    );

    res.json({ message: 'Change request sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 11. Reject onboarding
export const rejectOnboarding = async (req, res) => {
  try {
    const { onboarding_id } = req.params;
    const { reason } = req.body;
    const onboarding = await Onboarding.findById(onboarding_id);

    if (!onboarding) {
      return res.status(404).json({ error: 'Onboarding request not found' });
    }

    await Onboarding.update(onboarding_id, { status: 'rejected', rejection_reason: reason, rejected_by: req.user.id, rejected_at: new Date() });
    await sendEmail(onboarding.candidate_email, 'Onboarding Rejected', `<h2>Hello ${onboarding.candidate_name}</h2><p>Reason: ${reason}</p>`);

    res.json({ message: 'Onboarding rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 12. Get onboarding details
export const getOnboardingDetails = async (req, res) => {
  try {
    const { token } = req.params;
    const onboarding = await Onboarding.findByToken(token);

    if (!onboarding) {
      return res.status(404).json({ error: 'Onboarding not found' });
    }

    let bankInfo = onboarding.bank_info;
    if (bankInfo && bankInfo.account_number) {
      const encryptionService = await import('../utils/encryptionService.js');
      const decryptedAccount = encryptionService.decrypt(bankInfo.account_number);
      bankInfo = { ...bankInfo, account_number: encryptionService.maskAccountNumber(decryptedAccount) };
    }

    res.json({ onboarding: { ...onboarding, bank_info: bankInfo } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
