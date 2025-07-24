// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const Instructor = require('../models/Instructure');
const Student = require('../models/Student');

// Enhanced authenticate function
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check both collections
    const [instructor, student] = await Promise.all([
      Instructor.findById(decoded.id),
      Student.findById(decoded.id)
    ]);

    const user = instructor || student;
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (err) {
    res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
};

// Simplified JWT verifier
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers['x-access-token'];
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      message: 'No token provided' 
    });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : authHeader;

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    
    req.userId = decoded.id || decoded.sub || decoded.userId;
    next();
  });
};

// Export as named exports
module.exports = {
  authenticate,
  authenticateJWT
};