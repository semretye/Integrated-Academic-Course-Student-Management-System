const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your_fallback_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};

module.exports = { generateToken };