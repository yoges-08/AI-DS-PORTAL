const express = require('express');
const router = express.Router();
const { exportExcel, exportPdf } = require('../controllers/exportController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { exportLimiter } = require('../middleware/rateLimiter');

// Exports require admin privileges and dedicated export throttling (SEC-02)
router.use(authenticateToken, requireAdmin, exportLimiter);

router.get('/excel', exportExcel);
router.get('/pdf', exportPdf);

module.exports = router;
