const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getStudents,
  addStudent,
  bulkImportStudents,
  previewBulkImport,
  toggleLockStudent,
  resetStudentPassword,
  updateStudentStatus,
  getAuditLogs,
  deleteStudent,
  previewBulkStudents,
  bulkLockStudents,
  bulkDeleteStudents,
  getWhitelistEntries,
  deleteWhitelistEntry
} = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { bulkActionLimiter } = require('../middleware/rateLimiter');
const multer = require('multer');
const path = require('path');

const fs = require('fs');

const tempUploadDir = path.join(__dirname, '..', 'uploads', 'temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Multer storage for Excel/CSV bulk import
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `import-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      const err = new Error('Invalid file type. Only .xlsx, .xls or .csv files are allowed.');
      err.status = 400;
      cb(err);
    }
  }
});


// All admin routes require admin privileges
router.use(authenticateToken, requireAdmin);

router.get('/dashboard-stats', getDashboardStats);
router.get('/students', getStudents);
router.post('/students', addStudent);
router.post('/students/bulk-import/preview', bulkActionLimiter, upload.single('file'), previewBulkImport);
router.post('/students/bulk-import', bulkActionLimiter, upload.single('file'), bulkImportStudents);

// Bulk student operations with dedicated rate limiting (SEC-02)
router.post('/students/bulk/preview', bulkActionLimiter, previewBulkStudents);
router.patch('/students/bulk/lock', bulkActionLimiter, bulkLockStudents);
router.delete('/students/bulk', bulkActionLimiter, bulkDeleteStudents);

// Parameter validation for numeric IDs
router.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ success: false, message: 'Invalid student ID parameter.' });
  }
  next();
});

router.patch('/students/:id/lock', toggleLockStudent);
router.post('/students/:id/reset-password', resetStudentPassword);
router.patch('/students/:id/status', updateStudentStatus);
router.delete('/students/:id', deleteStudent);
router.get('/audit-logs', getAuditLogs);
router.get('/whitelist', getWhitelistEntries);
router.delete('/whitelist/:id', deleteWhitelistEntry);

module.exports = router;
