const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateToken(user, expiresIn = '1d') {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn });
}

module.exports = generateToken;
