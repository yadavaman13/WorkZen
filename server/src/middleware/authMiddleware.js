const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

async function protect(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ msg: 'No token provided' });
    }
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // fetch full user
    const user = await db('users').where({ id: decoded.id }).first();
    if (!user) return res.status(401).json({ msg: 'User not found' });
    if (user.status === 'suspended') return res.status(403).json({ msg: 'Account suspended' });
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ msg: 'Invalid token' });
  }
}

module.exports = { protect };
