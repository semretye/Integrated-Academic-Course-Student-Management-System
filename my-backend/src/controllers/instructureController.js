const Instructor = require('../models/Instructure');
const Course = require('../models/Course');
const AssignedCourse = require('../models/AssignedCourse');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment'); 
const Notification = require('../models/Notification');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Register instructor
exports.registerInstructor = async (req, res) => {
  try {
    const { username, password, email, name, bio, isHead } = req.body;

    // Basic validation
    if (!username || !password || !email || !name) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Check for existing user
    const existing = await Instructor.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newInstructor = new Instructor({
      username,
      password: hashedPassword,
      email,
      name,
      bio,
      isHead: isHead === 'true' || isHead === true,
      role: 'teacher', // always default to teacher
      documentPath: req.file?.path || null
    });

    const savedInstructor = await newInstructor.save();
    res.status(201).json({ success: true, instructor: savedInstructor });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};
exports.getMyCourses = async (req, res) => {
  try {
    console.log('Fetching courses for instructor:', req.user.id);
    
    // Query AssignedCourse instead of Course
    const assignments = await AssignedCourse.find({ instructorId: req.user._id })
      .populate('courseId', 'name code description')
      .populate('instructorId', 'name email');

    // Format the response to match expected structure
    const courses = assignments.map(assignment => ({
      _id: assignment.courseId._id,
      ...assignment.courseId._doc, // Spread all course fields
      instructor: assignment.instructorId
    }));

    console.log('Processed courses:', courses);

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });

  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get all instructors
exports.getAllInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.find().sort({ createdAt: -1 });
    res.status(200).json(instructors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch instructors' });
  }
};

// Get single instructor
exports.getInstructorById = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) return res.status(404).json({ error: 'Instructor not found' });
    res.status(200).json(instructor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch instructor' });
  }
};

// Update instructor
exports.updateInstructor = async (req, res) => {
  try {
    const { name, email, bio, isHead } = req.body;
    const updates = {
      name,
      email,
      bio,
      isHead: isHead === 'true' || isHead === true
    };

    if (req.file) {
      updates.documentPath = req.file.path;
    }

    const updated = await Instructor.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updated) return res.status(404).json({ error: 'Instructor not found' });

    res.status(200).json({ success: true, instructor: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update instructor' });
  }
};

// Delete instructor
exports.deleteInstructor = async (req, res) => {
  try {
    const deleted = await Instructor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Instructor not found' });

    res.status(200).json({ success: true, message: 'Instructor deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete instructor' });
  }
};
exports.getAssignmentFile = async (req, res) => {
  try {
    const { assignmentId, filename } = req.params;

    const assignment = await Assignment.findById(assignmentId).populate('courseId');
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Verify instructor access
    const isAssigned = await AssignedCourse.findOne({
      courseId: assignment.courseId._id,
      instructorId: req.user._id
    });
    if (!isAssigned) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Check if file exists
    if (!assignment.filePath) {
      return res.status(404).json({ message: 'No file attached' });
    }

    const filePath = path.join(__dirname, '..', assignment.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Set proper headers for download
    res.setHeader('Content-Disposition', `attachment; filename=${filename || path.basename(filePath)}`);
    res.sendFile(filePath);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// For submission files
exports.getSubmissionFile = async (req, res) => {
  try {
    const { submissionId, filename } = req.params;

    const submission = await Submission.findById(submissionId).populate('course');
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify instructor access
    const isAssigned = await AssignedCourse.findOne({
      courseId: submission.course._id,
      instructorId: req.user._id
    });
    if (!isAssigned) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Find the requested file
    const file = submission.files.find(f => f.name === filename);
    if (!file) {
      return res.status(404).json({ message: 'File not found in submission' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', 'submissions', file.path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set proper headers for download
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.sendFile(filePath);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCourseSubmissions = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify instructor access
    const isAssigned = await AssignedCourse.findOne({
      courseId,
      instructorId: req.user._id
    });

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this course'
      });
    }

    // Get all assignments with their files
    const assignments = await Assignment.find({ courseId })
      .select('_id title filePath originalFileName totalPoints');

    if (!assignments.length) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Get submissions with all necessary data
    const submissions = await Submission.find({
      assignment: { $in: assignments.map(a => a._id) }
    })
    .populate({
      path: 'student',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'assignment',
      select: 'title totalPoints dueDate filePath originalFileName'
    })
    .populate({
      path: 'course',
      select: 'name code'
    })
    .sort({ submittedAt: -1 });

    // Map assignments to include file data
    const submissionsWithFiles = submissions.map(sub => {
      const assignment = assignments.find(a => a._id.equals(sub.assignment._id));
      return {
        ...sub.toObject(),
        assignment: {
          ...sub.assignment.toObject(),
          filePath: assignment?.filePath,
          originalFileName: assignment?.originalFileName
        }
      };
    });

    res.json({
      success: true,
      count: submissionsWithFiles.length,
      data: submissionsWithFiles
    });
  } catch (err) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    console.log('Starting grade submission:', { submissionId, grade, feedback, user: req.user });

    if (grade === undefined || grade === null) {
      return res.status(400).json({ success: false, message: 'Grade is required' });
    }

    const numericGrade = Number(grade);
    if (isNaN(numericGrade)) {
      return res.status(400).json({ success: false, message: 'Grade must be a number' });
    }

    let submission = await Submission.findById(submissionId)
      .populate('assignment', 'totalPoints courseId')
      .populate('course', '_id')
      .populate('student', 'firstName lastName');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    console.log('Found submission:', {
      submissionId: submission._id,
      course: submission.course,
      assignment: submission.assignment,
      student: submission.student
    });

    // Patch missing course from assignment
    if (!submission.course) {
      const assignmentCourseId = submission.assignment?.courseId;
      if (assignmentCourseId) {
        console.log(`Patching submission.course from assignment.courseId: ${assignmentCourseId}`);
        submission.course = assignmentCourseId;
        await submission.save(); // patch it to DB
      } else {
        console.error('Missing course reference in both submission and assignment');
        return res.status(400).json({
          success: false,
          message: 'Submission is missing course reference'
        });
      }
    }

    // Ensure user exists
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Invalid user session' });
    }

    // Check if instructor is assigned to this course
    const isAssigned = await AssignedCourse.findOne({
      courseId: submission.course._id || submission.course,
      instructorId: req.user._id
    });

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to grade this submission'
      });
    }

    // Validate grade limit
    if (numericGrade > submission.assignment.totalPoints) {
      return res.status(400).json({
        success: false,
        message: `Grade cannot exceed ${submission.assignment.totalPoints}`
      });
    }

    // Save grade and feedback
    submission.grade = numericGrade;
    submission.feedback = feedback || '';
    submission.gradedAt = new Date();
    submission.gradedBy = req.user._id;

    const savedSubmission = await submission.save();
    console.log('Successfully graded submission:', savedSubmission._id);

    res.json({
      success: true,
      message: 'Submission graded successfully',
      data: {
        grade: savedSubmission.grade,
        feedback: savedSubmission.feedback,
        gradedAt: savedSubmission.gradedAt,
        student: {
          id: submission.student._id,
          name: `${submission.student.firstName} ${submission.student.lastName}`
        },
        assignment: {
          id: submission.assignment._id,
          totalPoints: submission.assignment.totalPoints
        }
      }
    });

  } catch (err) {
    console.error('Error grading submission:', {
      error: err.message,
      stack: err.stack,
      submissionId: req.params.submissionId,
      body: req.body,
      user: req.user
    });

    res.status(500).json({
      success: false,
      message: 'Failed to grade submission',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


exports.getSubmissionFile = async (req, res) => {
  try {
    const { submissionId, filename } = req.params;

    const submission = await Submission.findById(submissionId).populate('course');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const isAssigned = await AssignedCourse.findOne({
      courseId: submission.course._id,
      instructorId: req.user._id
    });

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this file'
      });
    }

    // Find the file in the submission
    const file = submission.files.find(f => f.name === filename);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found in submission'
      });
    }

    // Send the file
    const filePath = path.join(__dirname, '..', 'uploads', 'submissions', file.path);
    res.download(filePath, filename);
  } catch (err) {
    console.error('Error fetching submission file:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.downloadAssignmentFile = async (req, res) => {
  const { assignmentId } = req.params;

  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || !assignment.filePath) {
      return res.status(404).json({ message: 'File not found for assignment.' });
    }

    const filePath = path.resolve(__dirname, '../../uploads/materials', path.basename(assignment.filePath));
    const fileName = assignment.originalFileName || 'assignment.pdf';

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File does not exist on server.' });
    }

    res.download(filePath, fileName);
  } catch (error) {
    console.error('Assignment file download error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.createCourseNotification = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, message } = req.body;

    // Verify instructor is assigned to this course
    const isAssigned = await AssignedCourse.findOne({
      courseId,
      instructorId: req.user._id
    });

    if (!isAssigned) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not assigned to this course' 
      });
    }

    // Get all enrolled students for this course
    const course = await Course.findById(courseId).populate('students');
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Create notification for each student
    const notificationPromises = course.students.map(student => {
      return Notification.create({
        course: courseId,
        title,
        message,
        postedBy: req.user._id,
        recipient: student._id,
        isRead: false
      });
    });

    await Promise.all(notificationPromises);

    res.status(201).json({ 
      success: true, 
      message: `Notification sent to ${course.students.length} students`
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create notification' 
    });
  }
};
// GET: Fetch Notifications for Course
exports.getCourseNotifications = async (req, res) => {
  try {
    const { courseId } = req.params;

    const notifications = await Notification.find({ courseId })
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name email');

    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.updateNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { title, message } = req.body;

    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    // Optional: check ownership (req.user._id === notification.postedBy.toString())
    if (title) notification.title = title;
    if (message) notification.message = message;

    await notification.save();
    res.json({ success: true, data: notification });
  } catch (err) {
    console.error('Update notification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    await Notification.findByIdAndDelete(notificationId);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};