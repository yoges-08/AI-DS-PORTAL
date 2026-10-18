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

// Trust proxy for reverse proxy deployments (nginx, Render, etc.)
app.set('trust proxy', 1);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
const tempDir = path.join(__dirname, 'uploads', 'temp');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// CORS Configuration: Whitelist specific client in production; allow local loopback in development
const localOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === CLIENT_URL || (process.env.NODE_ENV !== 'production' && localOriginRegex.test(origin))) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy: unauthorized origin'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
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

    if (!fs.existsSync(absoluteDiskPath)) {
      return res.status(404).json({ success: false, message: 'Document file not found.' });
    }

    // Role-based access control: Students can only view their own documents; Admins can view all departmental files
    if (req.user.role === 'STUDENT') {
      const [docs] = await pool.query(
        'SELECT id FROM student_documents WHERE student_id = ? AND file_path = ?',
        [req.user.id, filePath]
      );
      const [photo] = await pool.query(
        'SELECT id FROM students WHERE id = ? AND photo_path = ?',
        [req.user.id, filePath]
      );

      if (docs.length === 0 && photo.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to view this document.'
        });
      }
    } else if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Security headers to prevent stored XSS and content sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    return res.sendFile(absoluteDiskPath);
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
