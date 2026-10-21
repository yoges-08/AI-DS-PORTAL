const express = require('express');
const router = express.Router();
const { loginStudent, loginAdmin, logout, getCurrentUser, changePassword } = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/authMiddleware');

// Auth endpoints
router.post('/student/login', loginLimiter, loginStudent);
router.post('/admin/login', loginLimiter, loginAdmin);
router.post('/logout', logout);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;
