const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect, restrictTo } = require('../controllers/authController');

// Student routes
router.get('/student', 
  protect, 
  restrictTo('student'), 
  notificationController.getStudentNotifications
);

router.patch('/:notificationId/read', 
  protect, 
  restrictTo('student'), 
  notificationController.markNotificationAsRead
);

// Instructor routes
router.post('/courses/:courseId',
  protect,
  restrictTo('instructor'),
  notificationController.createCourseNotification
);

module.exports = router;