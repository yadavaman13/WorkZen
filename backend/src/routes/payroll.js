import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/process', authenticate, authorize('admin', 'payroll_officer'), (req, res) => {
  res.json({ message: 'Process payroll' });
});

router.get('/payslips/employee/:id', authenticate, (req, res) => {
  res.json({ message: 'Employee payslips', id: req.params.id });
});

router.get('/payslip/:id', authenticate, (req, res) => {
  res.json({ message: 'Get payslip', id: req.params.id });
});

router.get('/report', authenticate, authorize('admin', 'payroll_officer'), (req, res) => {
  res.json({ message: 'Payroll report' });
});

router.put('/:id', authenticate, authorize('admin', 'payroll_officer'), (req, res) => {
  res.json({ message: 'Update payroll', id: req.params.id });
});

export default router;
