const Notification = require('../models/Notification');
const Student = require('../models/Student');

const Course = require('../models/Course');

// Get notifications for a student
exports.getStudentNotifications = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Find student with enrolled courses
    const student = await Student.findById(studentId)
      .populate('enrolledCourses')
      .select('enrolledCourses');
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    // Get course IDs
    const courseIds = student.enrolledCourses.map(c => c._id);

    // Find relevant notifications
    const notifications = await Notification.find({
      $or: [
        { recipients: studentId },
        { 
          course: { $in: courseIds },
          recipients: { $size: 0 } // Course-wide notifications
        }
      ]
    })
    .populate({
      path: 'course',
      select: 'name code',
      model: 'Course'
    })
    .populate({
      path: 'postedBy',  // Using the correct field name from schema
      select: 'firstName lastName',
      model: 'User'
    })
    .sort({ createdAt: -1 })
    .lean();

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });

  } catch (error) {
    console.error('Error in getStudentNotifications:', error);
    
    let errorMessage = 'Failed to get notifications';
    if (error.name === 'StrictPopulateError') {
      errorMessage = `Configuration error: ${error.message}`;
    }

    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Create course notification (instructor endpoint)
exports.createCourseNotification = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { courseId } = req.params;
    const { title, message } = req.body;
    const teacherId = req.user._id;

    // Validate input
    if (!title?.trim() || !message?.trim()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Verify course exists and teacher teaches it
    const course = await Course.findOne({
      _id: courseId,
      instructor: teacherId
    }).session(session);

    if (!course) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to post to this course or course not found' 
      });
    }

    // Create notification
    const notification = await Notification.create([{
      course: courseId,
      title: title.trim(),
      message: message.trim(),
      postedBy: teacherId
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: notification[0]
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create notification'
    });
  }
};
// Mark notification as read
// Enhanced getCourseNotifications with debugging
exports.getCourseNotifications = async (req, res) => {
  try {
    const { courseId } = req.params;
    const teacherId = req.user._id;

    console.log(`Fetching notifications for course: ${courseId} by teacher: ${teacherId}`);

    // Verify course exists and teacher is the instructor
    const course = await Course.findOne({
      _id: courseId,
      instructor: teacherId
    }).lean();

    if (!course) {
      console.log('Course not found or unauthorized access');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view notifications for this course'
      });
    }

    console.log('Course verification passed, fetching notifications...');

    const notifications = await Notification.find({ course: courseId })
      .populate('postedBy', 'firstName lastName')
      .populate('course', 'name code')
      .sort({ createdAt: -1 });

    console.log(`Found ${notifications.length} notifications`);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });

  } catch (error) {
    console.error('Error in getCourseNotifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications',
      error: error.message // Include error message for debugging
    });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { $addToSet: { readBy: req.user._id } }, // Track who read it
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