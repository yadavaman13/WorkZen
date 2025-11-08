const knex = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/leave-documents');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'leave-doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|jpg|jpeg|png|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, PNG, DOC files are allowed'));
    }
  }
});

// Get all time off requests (Admin can see all, Employee sees only their own)
const getAllTimeOffRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = knex('time_off_requests as tor')
      .select(
        'tor.*',
        'u.name as employee_name',
        'approver.name as approved_by_name',
        'rejecter.name as rejected_by_name'
      )
      .leftJoin('users as u', 'tor.user_id', 'u.id')
      .leftJoin('users as approver', 'tor.approved_by', 'approver.id')
      .leftJoin('users as rejecter', 'tor.rejected_by', 'rejecter.id');

    // If not admin, only show user's own requests
    if (userRole !== 'Admin') {
      query = query.where('tor.user_id', userId);
    }

    const requests = await query.orderBy('tor.created_at', 'desc');

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching time off requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time off requests',
      error: error.message
    });
  }
};

// Get user's leave balance
const getLeaveBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    let balance = await knex('leave_balances')
      .where({ user_id: userId, year: currentYear })
      .first();

    if (!balance) {
      // Create default balance if doesn't exist
      [balance] = await knex('leave_balances')
        .insert({
          user_id: userId,
          paid_leave_balance: 24,
          sick_leave_balance: 7,
          year: currentYear
        })
        .returning('*');
    }

    res.status(200).json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave balance',
      error: error.message
    });
  }
};

// Create a new time off request
const createTimeOffRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      leaveType,
      fromDate,
      toDate,
      durationType,
      description,
      contactNumber
    } = req.body;

    // Get document path if file was uploaded
    const documentPath = req.file ? `/uploads/leave-documents/${req.file.filename}` : null;

    // Validate required fields
    if (!leaveType || !fromDate || !toDate || !durationType || !description || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate sick leave document requirement
    if (leaveType === 'Sick' && !documentPath) {
      return res.status(400).json({
        success: false,
        message: 'Medical certificate is mandatory for sick leave'
      });
    }

    // Get user name
    const user = await knex('users').where({ id: userId }).first();
    const employeeName = user.name;

    // Get current balance
    const currentYear = new Date().getFullYear();
    const balance = await knex('leave_balances')
      .where({ user_id: userId, year: currentYear })
      .first();

    let balanceBefore = '0 Days';
    let balanceAfter = '0 Days';
    
    if (balance) {
      if (leaveType === 'Paid') {
        balanceBefore = `${balance.paid_leave_balance} Days`;
        // Calculate days difference
        const days = Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1;
        const daysToDeduct = durationType === 'Half Day' ? 0.5 : days;
        balanceAfter = `${Math.max(0, balance.paid_leave_balance - daysToDeduct)} Days`;
      } else if (leaveType === 'Sick') {
        balanceBefore = `${balance.sick_leave_balance} Days`;
        const days = Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1;
        const daysToDeduct = durationType === 'Half Day' ? 0.5 : days;
        balanceAfter = `${Math.max(0, balance.sick_leave_balance - daysToDeduct)} Days`;
      }
    }

    // Insert time off request
    const [request] = await knex('time_off_requests')
      .insert({
        user_id: userId,
        employee_name: employeeName,
        leave_type: leaveType,
        from_date: fromDate,
        to_date: toDate,
        duration_type: durationType,
        reason: description,
        contact_number: contactNumber,
        document_path: documentPath,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        status: 'pending'
      })
      .returning('*');

    res.status(201).json({
      success: true,
      message: 'Time off request submitted successfully',
      data: request
    });
  } catch (error) {
    console.error('Error creating time off request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create time off request',
      error: error.message
    });
  }
};

// Get a single time off request by ID
const getTimeOffRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = knex('time_off_requests as tor')
      .select(
        'tor.*',
        'u.name as employee_name',
        'approver.name as approved_by_name',
        'rejecter.name as rejected_by_name'
      )
      .leftJoin('users as u', 'tor.user_id', 'u.id')
      .leftJoin('users as approver', 'tor.approved_by', 'approver.id')
      .leftJoin('users as rejecter', 'tor.rejected_by', 'rejecter.id')
      .where('tor.id', id);

    // If not admin, ensure user can only see their own request
    if (userRole !== 'Admin') {
      query = query.where('tor.user_id', userId);
    }

    const request = await query.first();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Time off request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error fetching time off request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time off request',
      error: error.message
    });
  }
};

// Approve time off request (Admin only)
const approveTimeOffRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can approve time off requests'
      });
    }

    // Get the request details
    const request = await knex('time_off_requests').where({ id }).first();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Time off request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    // Update request status
    const [updatedRequest] = await knex('time_off_requests')
      .where({ id })
      .update({
        status: 'approved',
        approved_by: adminId,
        approved_at: knex.fn.now()
      })
      .returning('*');

    // Deduct leave balance
    const currentYear = new Date().getFullYear();
    const days = Math.ceil((new Date(request.to_date) - new Date(request.from_date)) / (1000 * 60 * 60 * 24)) + 1;
    const daysToDeduct = request.duration_type === 'Half Day' ? 0.5 : days;

    if (request.leave_type === 'Paid') {
      await knex('leave_balances')
        .where({ user_id: request.user_id, year: currentYear })
        .update({
          paid_leave_balance: knex.raw('GREATEST(0, paid_leave_balance - ?)', [daysToDeduct])
        });
    } else if (request.leave_type === 'Sick') {
      await knex('leave_balances')
        .where({ user_id: request.user_id, year: currentYear })
        .update({
          sick_leave_balance: knex.raw('GREATEST(0, sick_leave_balance - ?)', [daysToDeduct])
        });
    }

    res.status(200).json({
      success: true,
      message: 'Time off request approved successfully',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error approving time off request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve time off request',
      error: error.message
    });
  }
};

// Reject time off request (Admin only)
const rejectTimeOffRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can reject time off requests'
      });
    }

    // Check if request exists and is pending
    const request = await knex('time_off_requests').where({ id }).first();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Time off request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    // Update request status
    const [updatedRequest] = await knex('time_off_requests')
      .where({ id })
      .update({
        status: 'rejected',
        rejected_by: adminId,
        rejected_at: knex.fn.now()
      })
      .returning('*');

    res.status(200).json({
      success: true,
      message: 'Time off request rejected successfully',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error rejecting time off request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject time off request',
      error: error.message
    });
  }
};

module.exports = {
  getAllTimeOffRequests,
  getLeaveBalance,
  createTimeOffRequest,
  getTimeOffRequestById,
  approveTimeOffRequest,
  rejectTimeOffRequest,
  upload // Export multer middleware
};
