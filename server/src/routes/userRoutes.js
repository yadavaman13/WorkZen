const express = require('express');
const router = express.Router();
const { getProfileCompletion, getMe, createEmployee, getAllEmployees } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMe);
router.get('/profile-completion', protect, getProfileCompletion);
router.get('/employees', protect, getAllEmployees);
router.post('/create-employee', protect, createEmployee);

module.exports = router;
