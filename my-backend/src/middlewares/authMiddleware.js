const jwt = require('jsonwebtoken');
const Instructor = require('../models/Instructure');
const Student = require('../models/Student'); // Add this import

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Try to find as instructor first
    let user = await Instructor.findById(decoded.id);
    
    // If not found as instructor, try as student
    if (!user) {
      user = await Student.findById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

module.exports = { authenticate };