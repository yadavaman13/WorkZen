const express = require('express');
const router = express.Router();
const {
  getAllTimeOffRequests,
  getLeaveBalance,
  createTimeOffRequest,
  getTimeOffRequestById,
  approveTimeOffRequest,
  rejectTimeOffRequest,
  upload
} = require('../controllers/timeOffController');
const { getSmartSchedulingSuggestions } = require('../controllers/smartSchedulingController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// @route   GET /api/timeoff/smart-suggestions
// @desc    Get AI-powered smart scheduling suggestions
// @access  Private
router.get('/smart-suggestions', getSmartSchedulingSuggestions);

// @route   GET /api/timeoff
// @desc    Get all time off requests (Admin sees all, Employee sees their own)
// @access  Private
router.get('/', getAllTimeOffRequests);

// @route   GET /api/timeoff/balance
// @desc    Get user's leave balance
// @access  Private
router.get('/balance', getLeaveBalance);

// @route   POST /api/timeoff
// @desc    Create a new time off request
// @access  Private
router.post('/', upload.single('document'), createTimeOffRequest);

// @route   GET /api/timeoff/:id
// @desc    Get a single time off request by ID
// @access  Private
router.get('/:id', getTimeOffRequestById);

// @route   PUT /api/timeoff/:id/approve
// @desc    Approve a time off request (Admin only)
// @access  Private (Admin)
router.put('/:id/approve', approveTimeOffRequest);

// @route   PUT /api/timeoff/:id/reject
// @desc    Reject a time off request (Admin only)
// @access  Private (Admin)
router.put('/:id/reject', rejectTimeOffRequest);

module.exports = router;
