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

const fs = require('fs');

const tempUploadDir = path.join(__dirname, '..', 'uploads', 'temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Multer storage for Excel/CSV bulk import
const upload = multer({
  dest: tempUploadDir,
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
router.post('/students/bulk-import', upload.single('file'), bulkImportStudents);
router.patch('/students/:id/lock', toggleLockStudent);
router.post('/students/:id/reset-password', resetStudentPassword);
router.patch('/students/:id/status', updateStudentStatus);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
