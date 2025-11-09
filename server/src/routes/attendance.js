const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check if user has admin/HR access
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'hr') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or HR role required.'
    });
  }
  next();
};

// Public routes (require authentication)
router.get('/my-attendance', protect, attendanceController.getMyAttendance);
router.post('/check-in', protect, attendanceController.checkIn);
router.post('/check-out', protect, attendanceController.checkOut);
router.get('/summary', protect, attendanceController.getAttendanceSummary);

// Admin/HR routes
router.get('/records', protect, authorizeAdmin, attendanceController.getAttendanceRecords);
router.post('/mark', protect, authorizeAdmin, attendanceController.markAttendance);
router.get('/departments', protect, attendanceController.getDepartments);

module.exports = router;
