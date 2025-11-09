const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  getLeaveBalance,
  submitLeaveRequest,
  calculateLeaveImpact,
  approveLeaveRequest,
  rejectLeaveRequest,
  getEmployeeLeaveRequests,
  getAllLeaveRequests
} = require('../controllers/leaveManagementController');

// All routes require authentication
router.use(authenticate);

// Employee routes - anyone can access their own data
router.get('/balance/:employee_id', getLeaveBalance);
router.post('/request', submitLeaveRequest);
router.get('/requests/:employee_id', getEmployeeLeaveRequests);

// HR/Admin routes - view team impact and all requests
router.get('/impact', authorizeRoles('admin', 'hr', 'payroll'), calculateLeaveImpact);
router.get('/all-requests', authorizeRoles('admin', 'hr'), getAllLeaveRequests);

// HR/Admin routes - approve/reject
router.put('/approve/:requestId', authorizeRoles('admin', 'hr'), approveLeaveRequest);
router.put('/reject/:requestId', authorizeRoles('admin', 'hr'), rejectLeaveRequest);

module.exports = router;
