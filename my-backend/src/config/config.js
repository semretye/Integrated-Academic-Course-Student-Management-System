module.exports = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: '30d',
};