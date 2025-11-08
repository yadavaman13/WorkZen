import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/mark', authenticate, (req, res) => {
  res.json({ message: 'Mark attendance' });
});

router.get('/employee/:id', authenticate, (req, res) => {
  res.json({ message: 'Employee attendance', id: req.params.id });
});

router.get('/report', authenticate, authorize('admin', 'hr_officer'), (req, res) => {
  res.json({ message: 'Attendance report' });
});

export default router;
