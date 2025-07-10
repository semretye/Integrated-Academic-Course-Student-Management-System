const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../controllers/authController');
const fs = require('fs');

const { authenticate } = require('../middlewares/authMiddleware');
const submissionController = require('../controllers/submissionController');

// === MULTER CONFIGURATION ===

// Define the upload directory
const uploadDir = path.join(__dirname, '..', 'uploads', 'submissions');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Initialize upload middleware
const upload = multer({ storage });

// === ROUTES ===

// Get the logged-in student's submission for a specific assignment
router.get(
  '/:assignmentId/mine',
  authenticate,
  submissionController.getSubmissionByAssignmentAndStudent
);
router.post(
  '/', 
  authenticate, 
  upload.single('file'), 
  submissionController.submitAssignment
);

// Get assignments and student submissions for a specific course
router.get(
  '/courses/:courseId/assignments',
  authenticate,
  submissionController.getAssignmentsWithSubmissions
);
router.get(
  '/:assignmentId/mine',
  authenticate,
  submissionController.getSubmissionByAssignmentAndStudent
);
// Update an existing submission
router.put(
  '/:submissionId',
  authenticate,
  upload.single('file'),
  submissionController.updateSubmission
);
router.get(
  '/courses/:courseId/student-submissions',
  authenticate,
  submissionController.getStudentSubmissionsForCourse
);
router.get('/assignments/:assignmentId/student-submission', 
  authController.protect, 
  authController.restrictTo('student'),
  submissionController.getStudentSubmission
);

// Delete a submission
router.delete(
  '/:submissionId',
  authenticate,
  submissionController.deleteSubmission
);

module.exports = router;
