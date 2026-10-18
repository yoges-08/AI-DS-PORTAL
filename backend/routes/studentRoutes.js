const express = require('express');
const router = express.Router();
const {
  getStudentProfile,
  updateStudentDetails,
  submitStudentDetails,
  uploadDocument,
  deleteDocument
} = require('../controllers/studentController');
const { authenticateToken, requireSelfOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Student profile management
router.get('/profile', authenticateToken, requireSelfOrAdmin, getStudentProfile);
router.get('/profile/:id', authenticateToken, requireSelfOrAdmin, getStudentProfile);
router.put('/update', authenticateToken, requireSelfOrAdmin, updateStudentDetails);
router.put('/update/:id', authenticateToken, requireSelfOrAdmin, updateStudentDetails);
router.post('/submit', authenticateToken, requireSelfOrAdmin, submitStudentDetails);
router.post('/submit/:id', authenticateToken, requireSelfOrAdmin, submitStudentDetails);

// Document uploads
router.post('/documents/upload', authenticateToken, requireSelfOrAdmin, upload.single('document'), uploadDocument);
router.post('/documents/upload/:id', authenticateToken, requireSelfOrAdmin, upload.single('document'), uploadDocument);
router.delete('/documents/:docId', authenticateToken, requireSelfOrAdmin, deleteDocument);
router.delete('/documents/:docId/:id', authenticateToken, requireSelfOrAdmin, deleteDocument);

module.exports = router;
