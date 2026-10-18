const express = require('express');
const router = express.Router();
const { exportExcel, exportPdf } = require('../controllers/exportController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Exports require admin privileges
router.use(authenticateToken, requireAdmin);

router.get('/excel', exportExcel);
router.get('/pdf', exportPdf);

module.exports = router;
