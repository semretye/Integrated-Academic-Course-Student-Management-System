const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const { authenticate } = require('../middlewares/authMiddleware');
const assignmentController = require('../controllers/assignmentController');

// Set up file storage for assignments
const uploadDir = path.join(__dirname, '..', 'uploads', 'materials');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const targetDir = path.join(__dirname, '../../uploads/materials');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Routes

// Create assignment
router.post(
  '/courses/:courseId/assignments',
  authenticate,
  upload.single('file'),
  assignmentController.createAssignment
);
router.get(
  '/assignments/files/:filename',
  authenticate,
  assignmentController.downloadAssignmentFile
);
// Get all assignments for a course
router.get(
  '/courses/:courseId/assignments',authenticate,

  assignmentController.getAssignmentsByCourse
);

// Get one assignment
router.get(
  '/assignments/:assignmentId',
  assignmentController.getAssignmentById
);

// Update assignment
router.put(
  '/assignments/:assignmentId',
  upload.single('file'),
  assignmentController.updateAssignment
);

// Delete assignment
router.delete(
  '/assignments/:assignmentId',
  assignmentController.deleteAssignment
);

// Get submissions for assignment
router.get(
  '/assignments/:assignmentId/submissions',
  authenticate,
  assignmentController.getSubmissionsForAssignment
);
router.get(
  '/instructors/courses/:courseId/assignments',
  authenticate, // Ensure only logged-in instructors access this
  assignmentController.getAssignmentsForInstructor
);
router.get('/assignments/files/:filename',
   authenticate, 
   assignmentController.downloadAssignmentFile);
// Grade a submission
router.put(
  '/assignments/:assignmentId/submissions/:submissionId/grade',
    authenticate,
 
  assignmentController.gradeSubmission
);

// Download submission file
router.get(
  '/submissions/:submissionId/files/:filename',
    authenticate,
 
  assignmentController.downloadSubmissionFile
);

// ✅ FINAL EXPORT
module.exports = router;
