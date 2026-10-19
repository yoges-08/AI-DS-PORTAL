const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const { testConnection, pool } = require('./config/db');
const { authenticateToken } = require('./middleware/authMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

// Check critical production secrets
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('super_secret_jwt_key')) {
    console.error('FATAL: A secure, unique JWT_SECRET must be configured in production environment.');
    process.exit(1);
  }
  if (!process.env.COOKIE_SECRET || process.env.COOKIE_SECRET.includes('department_cookie_secret')) {
    console.error('FATAL: A secure, unique COOKIE_SECRET must be configured in production environment.');
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Trust proxy only when configured for reverse proxy environments (nginx, Render, Cloudflare, etc.)
if (process.env.TRUST_PROXY) {
  const tp = process.env.TRUST_PROXY;
  app.set('trust proxy', tp === 'true' ? 1 : (Number(tp) || tp));
}

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
const tempDir = path.join(__dirname, 'uploads', 'temp');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// CORS Configuration: Whitelist CLIENT_URL, same-host requests, and dev loopbacks
const localOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
app.use(cors((req, callback) => {
  const origin = req.headers.origin;
  let allowed = !origin || origin === CLIENT_URL;

  // Same-site request (site opened at its own served address / host)
  if (!allowed && origin) {
    try {
      allowed = new URL(origin).host === req.headers.host;
    } catch (e) {
      allowed = false;
    }
  }

  // Local development loopback
  if (!allowed && process.env.NODE_ENV !== 'production') {
    allowed = localOriginRegex.test(origin || '');
  }

  callback(null, {
    origin: allowed,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  });
}));


// API Request Logger (Development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.url} - Origin: ${req.headers.origin || 'none'}`);
    }
    next();
  });
}

// Global API rate limiter
app.use('/api', apiLimiter);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'department_cookie_secret_aids_2026'));

/**
 * Authenticated & Authorized Document Serving
 * Protects student Aadhaar, certificates, and passbook documents from unauthorized public access.
 */
app.get('/uploads/:filename', authenticateToken, async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = `/uploads/${filename}`;
    const absoluteDiskPath = path.join(uploadsDir, filename);

    // 1. Look up document in database (including file_data BLOB from TiDB)
    const [docs] = await pool.query(
      'SELECT id, student_id, file_name, mime_type, file_data FROM student_documents WHERE file_path = ?',
      [filePath]
    );

    let docRow = docs.length > 0 ? docs[0] : null;

    if (!docRow) {
      const [photo] = await pool.query(
        'SELECT id, name, photo_path FROM students WHERE photo_path = ?',
        [filePath]
      );
      if (photo.length > 0) {
        docRow = {
          student_id: photo[0].id,
          file_name: `${photo[0].name}_photo.jpg`,
          mime_type: 'image/jpeg',
          file_data: null
        };
      }
    }

    // Role-based access control: Students can only view their own documents; Admins can view all departmental files
    if (req.user.role === 'STUDENT') {
      if (!docRow || docRow.student_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to view this document.'
        });
      }
    } else if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Security headers to prevent content sniffing while allowing native Chrome/Edge PDF viewers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'");

    // 2. Serve from database LONGBLOB (TiDB Cloud)
    if (docRow && docRow.file_data) {
      res.setHeader('Content-Type', docRow.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(docRow.file_name || filename)}"`);
      return res.send(docRow.file_data);
    }

    // 3. Fallback to local server disk if file_data is not in database
    if (fs.existsSync(absoluteDiskPath)) {
      return res.sendFile(absoluteDiskPath);
    }

    return res.status(404).json({ success: false, message: 'Document file not found.' });

  } catch (err) {
    console.error('[Document Access Error]:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving document.' });
  }
});

// Serve production frontend build if available
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// Routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const exportRoutes = require('./routes/exportRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/export', exportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'Department Student Information System API (AI & DS)',
    timestamp: new Date().toISOString()
  });
});

// Explicit 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// SPA wildcard fallback for React Router in Express 5
if (fs.existsSync(frontendDist)) {
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Central error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum limit of 2MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server on 0.0.0.0 for robust local dual-stack binding
app.listen(PORT, '0.0.0.0', async () => {
  console.log('====================================================');
  console.log(`Department Student Information System - Backend Server`);
  console.log(`AI & DS Department Portal running on port: ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log(`CORS allowed client: ${CLIENT_URL}`);
  console.log('====================================================');

  // Verify DB connection
  await testConnection();
});
