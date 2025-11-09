import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fileUpload from 'express-fileupload';
import rateLimit from 'express-rate-limit';
import 'dotenv/config.js';
import 'express-async-errors';

// Import routes
import authRoutes from './src/routes/auth.js';
import usersRoutes from './src/routes/users.js';
import employeeRoutes from './src/routes/employees.js';
import attendanceRoutes from './src/routes/attendance.js';
import leaveRoutes from './src/routes/leaves.js';
import payrollRoutes from './src/routes/payroll.js';
import analyticsRoutes from './src/routes/analytics.js';
import onboardingRoutes from './src/routes/onboarding.js';

// Import middleware
import { errorHandler, asyncHandler } from './src/middleware/errorHandler.js';
import { authenticate } from './src/middleware/auth.js';
import logger from './src/utils/logger.js';

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// File Upload Middleware
app.use(fileUpload({
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  abortOnLimit: true,
  responseOnLimit: 'File size exceeds the maximum limit of 10 MB',
  useTempFiles: true,
  tempFileDir: './tmp/'
}));

// Logging Middleware
app.use(morgan('combined', { stream: logger.stream }));

// Health Check Endpoint
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const db = (await import('./src/config/database.js')).default;
    await db.raw('SELECT 1');
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'disconnected';
  }
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: dbStatus
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/manage', usersRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));
app.use('/documents', express.static('uploads/documents'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global Error Handler (must be last)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

export default app;
