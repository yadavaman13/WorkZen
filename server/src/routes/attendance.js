const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAttendanceRecords,
  getDepartments,
  markAttendance,
  updateAttendance,
  getAttendanceSummary
} = require('../controllers/attendanceController');

// Employee routes (authenticated users)
router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/my-attendance', protect, getMyAttendance);
router.get('/summary', protect, getAttendanceSummary);

// HR/Admin routes (all authenticated users can view, but some operations might need role check)
router.get('/records', protect, getAttendanceRecords);
router.get('/departments', protect, getDepartments);
router.post('/mark', protect, markAttendance); // Manual marking by HR/Admin
router.put('/:id', protect, updateAttendance); // Update attendance record

module.exports = router;
