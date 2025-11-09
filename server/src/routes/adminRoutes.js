const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Get all users (Settings page)
router.get('/users', protect, authorizeRoles('admin'), admin.getAllUsers);

// Update user role (Settings page)
router.put('/users/:userId/role', protect, authorizeRoles('admin'), admin.updateUserRole);

// HR can request escalation
router.post('/roles/escalate', protect, authorizeRoles('hr', 'admin'), admin.requestRoleEscalation);
// Admin can list and review escalations
router.get('/roles/escalations', protect, authorizeRoles('admin'), admin.listEscalations);
router.post('/roles/review', protect, authorizeRoles('admin'), admin.reviewEscalation);

// impersonation
router.post('/impersonate', protect, authorizeRoles('admin'), admin.impersonateUser);

// suspend/reactivate
router.post('/suspend', protect, authorizeRoles('admin'), admin.suspendUser);
router.post('/reactivate', protect, authorizeRoles('admin'), admin.reactivateUser);

module.exports = router;
