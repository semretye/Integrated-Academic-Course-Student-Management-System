// middleware/auth.js
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

exports.authenticateStudent = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, 'yourSecretKey');
    const student = await Student.findOne({ userId: decoded.id }).populate('enrolledCourses');

    if (!student) return res.status(404).json({ message: 'Student not found' });

    req.student = student;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
