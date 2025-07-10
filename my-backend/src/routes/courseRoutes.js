const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authController = require('../controllers/authController');



router.get('/available', 
  authController.protect,
  authController.restrictTo('student'),
  courseController.getAvailableCourses
);
router.get(
  '/:courseId/schedule',
  authController.protect,
  courseController.getCourseSchedule
);

router.post(
  '/',
  courseController.upload.single('image'), // Use Multer middleware
  courseController.createCourse
);
router.get('/', courseController.getAllCourses);
// Student enrollment
router.post(
  '/:courseId/enroll',
  authController.protect,
  courseController.enrollStudent
);

router.get('/', courseController.getAllCourses);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);
router.get('/:id', courseController.getCourseById);
router.get('/:id/stats', courseController.getCourseStats);
router.get('/:id/materials', authController.protect, courseController.getCourseMaterials);
 // Optional

module.exports = router;
