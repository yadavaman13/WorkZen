import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('Authentication failed:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ 
        error: 'Access denied',
        required_role: roles
      });
    }
    next();
  };
};

export const checkOwnership = (req, res, next) => {
  const resourceUserId = req.params.userId || req.body.user_id;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'hr_officer';

  if (req.user.id !== parseInt(resourceUserId) && !isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};
