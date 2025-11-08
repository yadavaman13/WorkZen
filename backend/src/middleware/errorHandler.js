import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Validation Error
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details?.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // File Upload Error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      error: 'File too large',
      limit: '10MB'
    });
  }

  // Database Error
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({ 
      error: 'Duplicate entry',
      detail: err.detail
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({ 
      error: 'Invalid reference',
      detail: err.detail
    });
  }

  // Default Error
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
