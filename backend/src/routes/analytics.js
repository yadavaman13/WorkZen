import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticate, authorize('admin', 'hr_officer'), (req, res) => {
  res.json({ message: 'Dashboard analytics' });
});

router.get('/attendance', authenticate, authorize('admin', 'hr_officer'), (req, res) => {
  res.json({ message: 'Attendance analytics' });
});

router.get('/payroll', authenticate, authorize('admin', 'payroll_officer'), (req, res) => {
  res.json({ message: 'Payroll analytics' });
});

router.get('/leaves', authenticate, authorize('admin', 'hr_officer'), (req, res) => {
  res.json({ message: 'Leaves analytics' });
});

export default router;
