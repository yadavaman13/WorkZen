import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as employeesController from '../controllers/employeesController.js';

const router = express.Router();

// Get all employees with pagination
router.get('/', authenticate, employeesController.getAllEmployees);

// Get employee statistics
router.get('/stats', authenticate, employeesController.getEmployeeStats);

// Generate new employee ID
router.post('/generate-id', authenticate, authorize('admin', 'hr_officer'), employeesController.generateNewEmployeeId);

// Get employee by employee ID (e.g., /api/employees/OI20250001)
router.get('/by-id/:employee_id', authenticate, employeesController.getEmployeeByEmployeeId);

// Create new employee
router.post('/', authenticate, authorize('admin', 'hr_officer'), employeesController.createEmployee);

// Get employee by database ID
router.get('/:id', authenticate, employeesController.getEmployeeById);

// Update employee
router.put('/:id', authenticate, authorize('admin', 'hr_officer'), employeesController.updateEmployee);

// Delete employee (soft delete)
router.delete('/:id', authenticate, authorize('admin', 'hr_officer'), employeesController.deleteEmployee);

export default router;
