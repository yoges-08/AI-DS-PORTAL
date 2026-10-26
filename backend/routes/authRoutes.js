const express = require('express');
const router = express.Router();
const { 
  loginStudent, 
  loginAdmin, 
  logout, 
  getCurrentUser, 
  changePassword,
  verifyStudentEligibility,
  registerStudent,
  verifyEmail,
  resendVerificationCode,
  changePendingEmail,
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPasswordWithToken
} = require('../controllers/authController');
const { 
  loginLimiter,
  verifyEligibilityLimiter,
  registerLimiter,
  emailCodeLimiter
} = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/authMiddleware');

// Student Onboarding & Authentication endpoints
router.post('/student/verify-eligibility', verifyEligibilityLimiter, verifyStudentEligibility);
router.post('/student/register', registerLimiter, registerStudent);
router.post('/student/verify-email', emailCodeLimiter, verifyEmail);
router.post('/student/resend-code', emailCodeLimiter, resendVerificationCode);
router.post('/student/change-pending-email', emailCodeLimiter, changePendingEmail);
router.post('/student/login', loginLimiter, loginStudent);
router.post('/admin/login', loginLimiter, loginAdmin);
router.post('/logout', logout);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/change-password', authenticateToken, changePassword);

// Self-service Password Reset endpoints
router.post('/forgot-password/request', emailCodeLimiter, requestPasswordReset);
router.post('/forgot-password/verify-code', emailCodeLimiter, verifyPasswordResetCode);
router.post('/forgot-password/reset', emailCodeLimiter, resetPasswordWithToken);

module.exports = router;
