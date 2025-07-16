const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Teacher = require('../models/Instructure');
const Admin = require('../models/Admin');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const findUserByRole = async (username, role) => {
  switch(role) {
    case 'student':
      return await Student.findOne({ username });
    case 'teacher':
      return await Teacher.findOne({ username });
    case 'admin':
      return await Admin.findOne({username});
    case 'manager':
      return await Admin.findOne({ username });
    default:
      return null;
  }
};

// Unified login
exports.login = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const user = await findUserByRole(username, role);

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    // New: check role consistency
    if (user.role !== role) {
      return res.status(401).json({ error: 'Role mismatch' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        specificId: user.studentId || user.teacherId || user.adminId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Registration handlers
exports.registerStudent = async (req, res) => {
  try {
    const { username, password, studentId } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const student = new Student({
      username,
      password: hashedPassword,
      studentId,
      role: 'student'
    });

    await student.save();
    res.status(201).json({ message: 'Student registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.registerInstructure = async (req, res) => {
  try {
    const { username, password, teacherId } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const teacher = new Teacher({
      username,
      password: hashedPassword,
      teacherId,
      role: 'teacher'
    });

    await teacher.save();
    res.status(201).json({ message: 'Teacher registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.registerAdmin = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!['admin', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid admin role' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const admin = new Admin({
      username,
      password: hashedPassword,
      role
    });

    await admin.save();
    res.status(201).json({ message: `${role} registered successfully` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized (no token)'
      });
    }

    // 1. Decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let currentUser;
    switch (decoded.role) {
      case 'student':
        currentUser = await Student.findById(decoded.id);
        break;
      case 'teacher':
        currentUser = await Teacher.findById(decoded.id);
        break;
      case 'admin':
      case 'manager':
        currentUser = await Admin.findById(decoded.id);
        break;
      default:
        return res.status(401).json({
          success: false,
          message: 'Invalid user role'
        });
    }

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // 2. Attach both token data and DB user data to req.user
    req.user = {
      id: decoded.id,
      role: decoded.role,
      ...currentUser.toObject() // includes name, email, etc.
    };

    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: err.message
    });
  }
};