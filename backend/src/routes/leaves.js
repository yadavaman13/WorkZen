import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/apply', authenticate, (req, res) => {
  res.json({ message: 'Apply leave' });
});

router.get('/employee/:id', authenticate, (req, res) => {
  res.json({ message: 'Employee leaves', id: req.params.id });
});

router.get('/pending', authenticate, authorize('admin', 'hr_officer'), (req, res) => {
  res.json({ message: 'Pending leaves' });
});

router.put('/approve/:id', authenticate, authorize('admin', 'hr_officer'), (req, res) => {
  res.json({ message: 'Approve leave', id: req.params.id });
});

router.put('/reject/:id', authenticate, authorize('admin', 'hr_officer'), (req, res) => {
  res.json({ message: 'Reject leave', id: req.params.id });
});

router.post('/allocate', authenticate, authorize('admin', 'hr_officer'), (req, res) => {
  res.json({ message: 'Allocate leaves' });
});

export default router;
