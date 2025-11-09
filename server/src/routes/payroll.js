const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check if user has payroll access (admin or payroll role)
const authorizePayroll = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'payroll') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Payroll management requires admin or payroll role.'
    });
  }
  next();
};

// Dashboard route
router.get('/dashboard', protect, authorizePayroll, payrollController.getDashboard);

// Payrun routes
router.post('/payruns', protect, authorizePayroll, payrollController.createPayrun);
router.get('/payruns/:payrunId', protect, authorizePayroll, payrollController.getPayrunDetails);
router.post('/payruns/:payrunId/compute', protect, authorizePayroll, payrollController.autoComputePayrun);

// Payslip routes
router.get('/employees/:employeeId/payslips', protect, payrollController.getEmployeePayslips);
router.get('/payslips/:payslipId', protect, payrollController.getPayslipDetails);
router.post('/payslips/:payslipId/compute', protect, authorizePayroll, payrollController.computePayslip);
router.post('/payslips/:payslipId/validate', protect, authorizePayroll, payrollController.validatePayslip);
router.post('/payslips/:payslipId/cancel', protect, authorizePayroll, payrollController.cancelPayslip);

module.exports = router;
