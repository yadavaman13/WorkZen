/**
 * Comprehensive Leave Management Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const comprehensiveLeaveController = require('../controllers/comprehensiveLeaveController');

// Employee routes
router.post('/calculate', protect, comprehensiveLeaveController.calculateLeaveRequest);
router.post('/submit', protect, comprehensiveLeaveController.submitLeaveRequest);
router.get('/balance/:employeeId?', protect, comprehensiveLeaveController.getLeaveBalance);
router.get('/my-requests', protect, comprehensiveLeaveController.getAllLeaveRequests);

// HR/Admin routes - View all requests
router.get('/all', protect, comprehensiveLeaveController.getAllLeaveRequests);
router.get('/:requestId', protect, comprehensiveLeaveController.getLeaveRequestById);
router.get('/:requestId/impact', protect, comprehensiveLeaveController.getLeaveImpact);

// HR/Admin routes - Approve/Reject
router.post('/:requestId/approve', protect, comprehensiveLeaveController.approveLeaveRequest);
router.post('/:requestId/reject', protect, comprehensiveLeaveController.rejectLeaveRequest);

module.exports = router;
