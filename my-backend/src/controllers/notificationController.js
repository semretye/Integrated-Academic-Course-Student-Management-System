const Notification = require('../models/Notification');
const Student = require('../models/Student');

const Course = require('../models/Course');

// Get notifications for a student
exports.getStudentNotifications = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Find the student with enrolled courses
    const student = await Student.findById(studentId).populate('enrolledCourses');
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    // Get course IDs the student is enrolled in
    const courseIds = student.enrolledCourses.map(c => c._id);

    // Find notifications that are either:
    // 1. Directly sent to the student OR
    // 2. Posted to courses the student is enrolled in
    const notifications = await Notification.find({
      $or: [
        { recipients: studentId }, // Direct messages
        { 
          course: { $in: courseIds }, // Course-wide messages
          recipients: { $size: 0 } // Not specifically targeted to individuals
        }
      ]
    })
    .populate({
      path: 'course',
      select: 'name code _id'
    })
    .populate({
      path: 'postedBy',
      select: 'firstName lastName'
    })
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get notifications' 
    });
  }
};

// Create course notification (instructor endpoint)
exports.createCourseNotification = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, message } = req.body;
    const instructorId = req.user._id;

    // Verify the instructor teaches this course
    const course = await Course.findOne({
      _id: courseId,
      instructor: instructorId
    });
    
    if (!course) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to post to this course' 
      });
    }

    // Create the notification (empty recipients array means it's for all enrolled students)
    const notification = new Notification({
      course: courseId,
      title,
      message,
      postedBy: instructorId,
      recipients: [], // Empty array means it's for all students in the course
      isRead: false
    });

    await notification.save();

    // Here you would typically add Socket.io code to notify students in real-time
    // io.to(`course-${courseId}`).emit('new-notification', notification);

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create notification' 
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
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// Create a new course notification (for instructors)
