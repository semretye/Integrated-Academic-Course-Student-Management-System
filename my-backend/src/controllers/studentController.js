 
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const multer = require('multer');
const Schedule = require('../models/Schedule');
const Grade = require('../models/Grade');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `student-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};
const getFullImageUrl = (req, path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // Ensure path doesn't start with a slash to prevent double slashes
  const cleanPath = path.replace(/^\/?uploads\//, 'uploads/');
  return `${req.protocol}://${req.get('host')}/${cleanPath.replace(/\\/g, '/')}`;
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, config.secret, {
    expiresIn: config.expiresIn
  });
};

exports.registerStudent = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, gender, 
            street, city, state, zipCode, country, username, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !dateOfBirth || 
        !gender || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if email is already registered
    const existingEmail = await Student.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered'
      });
    }

    // Check if username is already taken
    const existingUsername = await Student.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username is already taken'
      });
    }

    // Check if profile picture was uploaded
    let profilePicture = '';
    if (req.file) {
      profilePicture = req.file.path;
    }

    // Create new student
    const newStudent = await Student.create({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address: {
        street,
        city,
        state,
        zipCode,
        country
      },
      username,
      password,
      profilePicture
      // role is automatically set to 'student' by default
    });

    // Remove password from output
    newStudent.password = undefined;

    // Create token
    const token = signToken(newStudent._id);

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      token,
      student: newStudent
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate fields
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};
exports.getStudentMessages = async (req, res) => {
  try {
    const studentId = req.user._id;

    const messages = await Message.find({ receiver: studentId })
      .populate('sender', 'firstName lastName role') // Optional
      .sort({ sentAt: -1 });

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (err) {
    console.error('Error fetching student messages:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};
exports.submitAssignment = async (req, res) => {
  try {
    const studentId = req.user._id;
    const assignmentId = req.params.assignmentId;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Check if already submitted
    const existing = await Submission.findOne({ assignment: assignmentId, student: studentId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Assignment already submitted' });
    }

    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    const submission = new Submission({
      assignment: assignmentId,
      student: studentId,
        course: assignment.courseId,
      file: filePath,
      submittedAt: new Date(),
      graded: false
    });

    await submission.save();

    res.status(200).json({ success: true, message: 'Assignment submitted successfully', data: submission });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
exports.getSubmittedAssignments = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const courseId = req.params.courseId;

    // Verify the student is enrolled in the course
    const course = await Course.findOne({
      _id: courseId,
      students: studentId
    });

    if (!course) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    const submissions = await Submission.find({
      student: studentId,
      course: courseId
    }).populate('assignment', 'title description dueDate totalPoints');

    res.status(200).json({
      success: true,
      results: submissions.length,
      data: {
        submissions
      }
    });
  } catch (err) {
    console.error('Error getting submitted assignments:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get submitted assignments'
    });
  }
};


exports.downloadSubmissionFile = async (req, res) => {
  try {
    const submissionId = req.params.submissionId;
    const studentId = req.user._id; // Get student ID from authenticated user

    // Find submission and verify ownership
    const submission = await Submission.findOne({
      _id: submissionId,
      student: studentId
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found or you are not authorized'
      });
    }

    // Check if file exists in submission
    if (!submission.file) {
      return res.status(404).json({
        success: false,
        message: 'No file found for this submission'
      });
    }

    // Construct absolute file path
    const filePath = path.join(__dirname, '..', submission.file);

    // Check if file exists in filesystem
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Determine filename (use original name if available, otherwise generate one)
    const filename = submission.fileName || 
                    `submission-${submissionId}${path.extname(filePath)}`;

    // Set headers
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Handle stream errors
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      res.status(500).json({
        success: false,
        message: 'Error streaming file'
      });
    });

  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to download submission file',
      error: err.message
    });
  }
};

exports.getStudentNotifications = async (req, res) => {
  try {
    const { timestamp } = req.query;
    
    // Validate timestamp
    if (!timestamp || isNaN(timestamp)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or missing timestamp parameter'
      });
    }

    const lastChecked = new Date(parseInt(timestamp));
    
    // Fetch notifications for this student since the last checked time
    const notifications = await Notification.find({
      student: req.user.id,
      createdAt: { $gt: lastChecked },
      read: false
    }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: {
        notifications
      }
    });

  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications',
      error: err.message
    });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.notificationId,
        student: req.user.id
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        notification
      }
    });

  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read',
      error: err.message
    });
  }
};
// studentController.js - Updated getStudentNotifications
exports.getStudentNotifications = async (req, res) => {
  try {
    // Get student with enrolled courses
    const student = await Student.findById(req.user._id)
      .select('enrolledCourses')
      .populate('enrolledCourses', '_id');
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    // Get notifications for enrolled courses or specifically for this student
    const notifications = await Notification.find({
      $or: [
        { recipient: req.user._id },
        { 
          course: { $in: student.enrolledCourses.map(c => c._id) },
          recipient: { $exists: false } // Course-wide notifications
        }
      ]
    })
    .sort({ createdAt: -1 })
    .populate({
      path: 'course',
      select: 'name code',
      model: 'Course'
    })
    .populate({
      path: 'postedBy',
      select: 'firstName lastName',
      model: 'Instructor'
    })
    .lean();

    // Format response data
    const responseData = notifications.map(notif => ({
      _id: notif._id,
      title: notif.title,
      message: notif.message,
      isRead: notif.isRead || false,
      createdAt: notif.createdAt,
      course: notif.course || null,
      postedBy: notif.postedBy || null
    }));

    res.json({
      success: true,
      count: responseData.length,
      data: responseData
    });

  } catch (err) {
    console.error('Notification fetch error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password'); // exclude passwords
    res.json({ success: true, students });
  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
};
exports.getStudentAssignments = async (req, res) => {
  try {
    // Disable caching
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const student = await Student.findById(req.user._id)
      .populate({
        path: 'enrolledCourses',
        select: '_id'
      });

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    const courseIds = student.enrolledCourses.map(c => c._id);
    
    // Add course filter if provided
    const query = {
      course: { $in: courseIds },
      status: 'published'
    };

    if (req.query.courseId) {
      query.course = req.query.courseId;
    }

    const assignments = await Assignment.find(query)
      .populate('course', 'name code')
      .populate('instructor', 'firstName lastName')
      .lean(); // Use lean() for better performance

    // Ensure each assignment has required fields
    const processedAssignments = assignments.map(assignment => ({
      ...assignment,
      submitted: assignment.submitted || false,
      graded: assignment.graded || false,
      dueDate: assignment.dueDate || new Date(),
      attachments: assignment.attachments || []
    }));

    res.status(200).json({
      success: true,
      data: processedAssignments
    });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch assignments',
      error: err.message 
    });
  }
};

exports.getStudentGrades = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find all grades for this student, populate assignment and course info
    const grades = await Grade.find({ student: studentId })
      .populate({
        path: 'assignment',
        select: 'title dueDate course',
        populate: {
          path: 'course',
          select: 'name'
        }
      })
      .sort({ 'assignment.dueDate': -1 }); // sort by dueDate descending

    res.status(200).json({
      status: 'success',
      data: grades,
    });
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({
      status: 'error',
      message: 'Could not fetch grades',
    });
  }
};



exports.getEnrolledCourses = async (req, res) => {
  try {
    // Find the student and populate the enrolled courses
    const student = await Student.findById(req.user._id)
      .populate({
        path: 'enrolledCourses',
        select: 'name code thumbnail instructor description',
        populate: {
          path: 'instructor',
          select: 'firstName lastName'
        }
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student.enrolledCourses
    });
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrolled courses',
      error: error.message // Include error message for debugging
    });
  }
};
exports.getStudentSchedule = async (req, res) => {
  try {
    const studentId = req.user.id; // comes from JWT middleware

    const schedule = await Schedule.find({ student: studentId })
      .populate('course', 'name code') // optional
      .populate('instructor', 'firstName lastName') // optional
      .sort({ day: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (err) {
    console.error('Error fetching schedule:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student schedule',
    });
  }
};

// Get student by ID
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student' });
  }
};

// Update student info
exports.updateStudent = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Handle profile picture if uploaded
    if (req.file) updateData.profilePicture = req.file.path;

    const student = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    res.json({ success: true, message: 'Student updated', student });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: 'Failed to update student' });
  }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: 'Student deleted' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete student' });
  }
};
exports.getMyProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id)
      .select('-password -__v')
      .populate('enrolledCourses');

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    const studentObj = student.toObject();
    studentObj.profilePicture = getFullImageUrl(req, student.profilePicture);
    
    res.status(200).json({
      success: true,
      data: studentObj
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const studentId = req.user._id;

    const updates = { ...req.body };

    // If image was uploaded
    if (req.file) {
      updates.profilePicture = req.file.path;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Format profile picture URL
    const studentObj = updatedStudent.toObject();
    if (studentObj.profilePicture) {
      studentObj.profilePicture = `${req.protocol}://${req.get('host')}/${studentObj.profilePicture.replace(/\\/g, '/')}`;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: studentObj
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};
exports.deleteMyAccount = async (req, res) => {
  try {
    const studentId = req.user._id;

    const deleted = await Student.findByIdAndDelete(studentId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
};

exports.getStudentNotifications = async (req, res) => {
  try {
    // Get the student with enrolled courses
    const student = await Student.findById(req.user._id)
      .select('enrolledCourses')
      .populate('enrolledCourses');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get notifications for all enrolled courses
    const notifications = await Notification.find({
      course: { $in: student.enrolledCourses }
    })
      .sort({ createdAt: -1 })
      .populate('course', 'name code')
      .populate('sentBy', 'firstName lastName');

    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};


// Get available courses (not enrolled yet)
