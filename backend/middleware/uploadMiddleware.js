const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Strict document type allowlist
const ALLOWED_DOC_TYPES = [
  'photo',
  'aadhaar',
  'bank_passbook',
  'community_cert',
  'income_cert',
  'first_graduate_cert',
  'sslc_marksheet',
  'hsc_marksheet',
  'other'
];

// Strict extension & MIME allowlist (no octet-stream/html)
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/pjpeg',
  'image/x-png',
  'image/webp',
  'application/pdf'
];

// Storage configuration with path traversal protection
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Validate docType against strict allowlist (prevent path traversal / directory escaping)
    const rawDocType = typeof req.body?.docType === 'string' ? req.body.docType.trim() : '';
    const safeDocType = ALLOWED_DOC_TYPES.includes(rawDocType) ? rawDocType : 'doc';
    // Sanitize register number to alphanumeric only
    const safeRegNo = String(req.user?.registerNo || 'student').replace(/[^a-zA-Z0-9]/g, '');
    const randomHex = crypto.randomBytes(8).toString('hex');
    cb(null, `${safeRegNo}-${safeDocType}-${Date.now()}-${randomHex}${ext}`);
  }
});

// File filter: require BOTH valid extension and valid MIME type (prevents HTML/SVG/XSS)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase();

  if (ALLOWED_EXTS.includes(ext) && ALLOWED_MIME_TYPES.includes(mime)) {
    cb(null, true);
  } else {
    req.fileValidationError = 'Invalid file type. Only PDF, JPG, PNG, and WebP files are permitted.';
    cb(null, false);
  }
};

// Limit: 10MB buffer in multer, 2MB enforced in controller
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter
});

// Memory storage configuration for student documents (Cloudflare R2)
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter
});

/**
 * Generate a safe unique key for Cloudflare R2 object storage
 */
const generateDocumentKey = (registerNo, docType, originalname) => {
  const ext = path.extname(originalname || '').toLowerCase();
  const rawDocType = typeof docType === 'string' ? docType.trim() : '';
  const safeDocType = ALLOWED_DOC_TYPES.includes(rawDocType) ? rawDocType : 'doc';
  const safeRegNo = String(registerNo || 'student').replace(/[^a-zA-Z0-9]/g, '');
  const randomHex = crypto.randomBytes(8).toString('hex');
  return `${safeRegNo}-${safeDocType}-${Date.now()}-${randomHex}${ext}`;
};

upload.ALLOWED_DOC_TYPES = ALLOWED_DOC_TYPES;
upload.ALLOWED_EXTS = ALLOWED_EXTS;
upload.ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES;
upload.upload = upload;
upload.documentUpload = documentUpload;
upload.generateDocumentKey = generateDocumentKey;

module.exports = upload;
module.exports.upload = upload;
module.exports.documentUpload = documentUpload;
module.exports.generateDocumentKey = generateDocumentKey;
module.exports.ALLOWED_DOC_TYPES = ALLOWED_DOC_TYPES;
module.exports.ALLOWED_EXTS = ALLOWED_EXTS;
module.exports.ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES;
