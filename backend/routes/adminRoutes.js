const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getStudents,
  addStudent,
  bulkImportStudents,
  toggleLockStudent,
  resetStudentPassword,
  updateStudentStatus,
  getAuditLogs
} = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer storage for Excel/CSV bulk import
const upload = multer({
  dest: path.join(__dirname, '..', 'uploads', 'temp'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// All admin routes require admin privileges
router.use(authenticateToken, requireAdmin);

router.get('/dashboard-stats', getDashboardStats);
router.get('/students', getStudents);
router.post('/students', addStudent);
router.post('/students/bulk-import', upload.single('file'), bulkImportStudents);
router.patch('/students/:id/lock', toggleLockStudent);
router.post('/students/:id/reset-password', resetStudentPassword);
router.patch('/students/:id/status', updateStudentStatus);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
