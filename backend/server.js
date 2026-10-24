const dotenv = require('dotenv');
// Load environment variables immediately before requiring application modules
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const { testConnection, pool, getDbMode } = require('./config/db');
const { authenticateToken } = require('./middleware/authMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');
const { downloadObject, isStorageConfigured, keepAlive, getStorageProvider } = require('./config/storage');
const { JWT_SECRET, COOKIE_SECRET } = require('./config/secrets');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// S15: Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' }
}));

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

// S1: Strict CORS Whitelist (Eliminates wildcard *.vercel.app and host-header spoofing)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(url => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const localOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors((req, callback) => {
  const origin = req.headers.origin;
  const allowed =
    !origin || // Non-browser or same-origin requests
    allowedOrigins.includes(origin) || // Explicitly whitelisted frontend origin(s)
    (process.env.NODE_ENV !== 'production' && localOriginRegex.test(origin));

  callback(null, {
    origin: allowed,
    credentials: true,
    maxAge: 86400,
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

// B8 fix: Limit JSON payload to 1MB to prevent memory exhaustion
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// S12 fix: Use validated COOKIE_SECRET imported from config/secrets
app.use(cookieParser(COOKIE_SECRET));

// S6 fix: CSRF Origin verification for state-changing HTTP requests
const csrfOriginCheck = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin) return next(); // non-browser clients (e.g. mobile, curl, server-to-server)
  let originHost;
  try {
    originHost = new URL(origin).origin;
  } catch {
    return res.status(403).json({ success: false, message: 'Invalid origin header.' });
  }
  const isAllowed = allowedOrigins.includes(originHost) || 
    (process.env.NODE_ENV !== 'production' && localOriginRegex.test(originHost));
  if (!isAllowed) {
    return res.status(403).json({ success: false, message: 'Cross-site request blocked.' });
  }
  next();
};
app.use('/api', csrfOriginCheck);

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

    // 1. Primary: Serve object from Storage (Supabase Storage / R2 via unified adapter)
    if (isStorageConfigured()) {
      try {
        const fileObj = await downloadObject(filename);
        if (fileObj && fileObj.buffer) {
          res.setHeader('Content-Type', docRow?.mime_type || fileObj.contentType || 'application/octet-stream');
          res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(docRow?.file_name || filename)}"`);
          res.setHeader('Content-Length', fileObj.buffer.length);
          return res.send(fileObj.buffer);
        }
      } catch (storageErr) {
        console.warn(`[Storage Fetch Notice for ${filename}]:`, storageErr.message);
      }
    }

    // 2. TEMP FALLBACK: remove after storage migration is verified
    // Fallback A: Serve from database LONGBLOB (TiDB Cloud / SQLite)
    if (docRow && docRow.file_data) {
      res.setHeader('Content-Type', docRow.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(docRow.file_name || filename)}"`);
      return res.send(docRow.file_data);
    }

    // Fallback B: Serve from local server disk
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

// Health check endpoint with live database and storage verification
app.get('/api/health', async (req, res) => {
  let dbStatus = { connected: false, mode: getDbMode() };
  try {
    const [result] = await pool.query('SELECT 1 AS ping');
    if (result && result.length > 0) {
      dbStatus = {
        connected: true,
        mode: getDbMode(),
        database: process.env.DB_NAME || 'aids_portal'
      };
    }
  } catch (dbErr) {
    dbStatus = {
      connected: false,
      mode: getDbMode(),
      error: process.env.NODE_ENV === 'production' ? 'Database service unavailable' : dbErr.message
    };
  }

  const statusCode = dbStatus.connected ? 200 : 503;
  console.log(`[Health Ping] Received ping at ${new Date().toISOString()} from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'} (Status: ${dbStatus.connected ? 'OK' : 'ERR'})`);
  res.status(statusCode).json({
    status: dbStatus.connected ? 'HEALTHY' : 'DEGRADED',
    service: 'Department Student Information System API (AI & DS)',
    database: dbStatus,
    storage: {
      provider: getStorageProvider(),
      configured: isStorageConfigured()
    },
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
} else {
  app.get('/', (req, res) => {
    res.json({
      status: 'UP',
      service: 'Department Student Information System API (AI & DS)',
      message: 'Backend server is running on Render.',
      clientUrl: CLIENT_URL,
      health: '/api/health'
    });
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

  const status = err.status && err.status < 500 ? err.status : 500;
  return res.status(status).json({
    success: false,
    message: status === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : (err.message || 'Internal Server Error')
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

  // Step 11: Free-plan keep-alive for Supabase Storage (prevents auto-pause from inactivity)
  if (getStorageProvider() === 'supabase' && isStorageConfigured()) {
    try {
      await keepAlive();
    } catch (e) {
      console.warn('[Supabase Initial Keep-Alive Notice]:', e.message);
    }

    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const keepAliveTimer = setInterval(async () => {
      try {
        await keepAlive();
      } catch (e) {
        console.warn('[Supabase Periodic Keep-Alive Notice]:', e.message);
      }
    }, TWENTY_FOUR_HOURS);
    keepAliveTimer.unref();
  }
});
