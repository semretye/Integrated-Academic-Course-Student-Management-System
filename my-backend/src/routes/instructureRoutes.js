const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructureController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middlewares/authMiddleware');

// Define absolute uploads directory path
const uploadDir = path.join(__dirname, '..', 'uploads');

// Create uploads folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer with ensured existing directory
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/submissions');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: submissionStorage,  // Use the new storage
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.doc', '.docx'].includes(ext)) cb(null, true);
    else cb(new Error('Only PDF/DOC/DOCX files are allowed'));
  }
});

// Routes
router.post('/register', upload.single('documentFile'), instructorController.registerInstructor);
router.get('/', instructorController.getAllInstructors);
router.get('/my-courses', authenticate, instructorController.getMyCourses);
router.get('/courses/:courseId/submissions', 
  authenticate, 
  instructorController.getCourseSubmissions
);
router.get(
  '/assignments/:assignmentId/files/:filename',
  authenticate,
  instructorController.getAssignmentFile
);

// Grade a submission
router.put('/submissions/:submissionId/grade', 
  authenticate, 
  instructorController.gradeSubmission
);
router.post(
  '/courses/:courseId/notifications',
  authenticate,
  instructorController.createCourseNotification
);

router.get(
  '/courses/:courseId/notifications',
  authenticate,
  instructorController.getCourseNotifications
);
router.put(
  '/courses/:courseId/notifications/:notificationId',
  authenticate,
  instructorController.updateNotification
);

router.delete(
  '/courses/:courseId/notifications/:notificationId',
  authenticate,
  instructorController.deleteNotification
);

router.get('/assignments/:assignmentId/files', authenticate, instructorController.downloadAssignmentFile);

// Get submission file
router.get('/submissions/:submissionId/files/:filename', 
  authenticate, 
  instructorController.getSubmissionFile
);
router.get('/:id', instructorController.getInstructorById);

router.put('/:id', upload.single('documentFile'), instructorController.updateInstructor);
router.delete('/:id', instructorController.deleteInstructor);

module.exports = router;
