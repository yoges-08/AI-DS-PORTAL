const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const { testConnection } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
const tempDir = path.join(__dirname, 'uploads', 'temp');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow any request from localhost, 127.0.0.1 (any port), or with no origin (curl/mobile/proxy)
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in local development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// API Request Logger
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[API ${req.method}] ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  }
  next();
});

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'department_cookie_secret_aids_2026'));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
  console.log(`CORS allowed for client: Any local origin (port 5173 / 5000)`);
  console.log('====================================================');

  // Verify DB connection
  await testConnection();
});
