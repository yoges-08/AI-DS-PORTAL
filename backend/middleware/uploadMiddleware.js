const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const docType = req.body.docType || file.fieldname || 'doc';
    const regNo = req.user?.registerNo || 'student';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${regNo}-${docType}-${uniqueSuffix}${ext}`);
  }
});

// File filter (PDF, JPG, PNG, WebP)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/jpg', 'image/pjpeg', 'image/x-png',
    'image/webp', 'image/jfif', 'image/bmp', 'application/pdf', 'application/octet-stream'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.jfif', '.bmp'];

  if (allowedMimeTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    req.fileValidationError = 'Invalid file type. Only PDF, JPG, PNG, and WebP files are allowed.';
    cb(null, false); // Do not destroy socket; let controller return clean JSON response
  }
};

// Limit: 10MB in multer so socket is not abruptly destroyed, 2MB enforced in controller
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 Megabytes buffer
  },
  fileFilter
});

module.exports = upload;
