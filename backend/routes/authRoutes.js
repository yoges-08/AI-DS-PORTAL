const express = require('express');
const router = express.Router();
const { 
  loginStudent, 
  loginAdmin, 
  logout, 
  getCurrentUser, 
  changePassword,
  verifyStudentEligibility,
  registerStudent
} = require('../controllers/authController');
const { 
  loginLimiter,
  verifyEligibilityLimiter,
  registerLimiter
} = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/authMiddleware');

// Student Onboarding & Authentication endpoints
router.post('/student/verify-eligibility', verifyEligibilityLimiter, verifyStudentEligibility);
router.post('/student/register', registerLimiter, registerStudent);
router.post('/student/login', loginLimiter, loginStudent);
router.post('/admin/login', loginLimiter, loginAdmin);
router.post('/logout', logout);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;
