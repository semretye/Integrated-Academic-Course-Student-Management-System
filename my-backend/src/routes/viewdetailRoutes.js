const express = require('express');
const router = express.Router();
const {
  getInstructorCourses,
  scheduleClass,
  uploadMaterial,
  downloadMaterial,
  createAssignment,
  downloadAssignment,
  getSubmissions
} = require('../controllers/viewDetailController'); // Ensure correct path
const upload = require('../config/multer');
const { protect } = require('../middlewares/authMiddleware');

// Get all courses for instructor
router.get('/instructors/:instructorId/courses', protect, getInstructorCourses);

// Schedule a class
router.post('/courses/:courseId/schedule', protect, scheduleClass);

// Upload material
router.post('/courses/:courseId/materials', protect, upload.single('file'), uploadMaterial);

// Download material
router.get('/materials/:materialId/download', protect, downloadMaterial);

// Create assignment
router.post('/courses/:courseId/assignments', protect, upload.single('file'), createAssignment);

// Download assignment
router.get('/assignments/:assignmentId/download', protect, downloadAssignment);

// View submissions
router.get('/assignments/:assignmentId/submissions', protect, getSubmissions);

module.exports = router;