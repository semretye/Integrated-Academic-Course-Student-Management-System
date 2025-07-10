const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../controllers/authController');
const multer = require('multer');

const { authenticateStudent } = require('../middlewares/auth');

// Multer config for memory storage
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Increased limit to 10MB
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image, PDF, and Word document files are allowed!'), false);
    }
  }
});

// Register student
router.get('/me', authController.protect, studentController.getMyProfile);
router.put('/profile', authController.protect,authController.restrictTo('student'), upload.single('profilePicture'), studentController.updateMyProfile);
router.delete('/account', authController.protect, studentController.deleteMyAccount);

// Get all students
router.post('/register', upload.single('profilePicture'), studentController.registerStudent);

router.get('/', studentController.getAllStudents);

router.get('/schedule',
  authController.protect,
  authController.restrictTo('student'),
  studentController.getStudentSchedule
);

router.get('/assignments',
  authController.protect,
  authController.restrictTo('student'),
  studentController.getStudentAssignments
);

router.get('/enrolled-courses', 
  authController.protect,
  authController.restrictTo('student'),
  studentController.getEnrolledCourses
);
router.get(
  '/courses/:courseId/assignments/submitted',
  authController.protect,
  authController.restrictTo('student'),
  studentController.getSubmittedAssignments
);

router.post(
  '/assignments/:assignmentId/submit',
  authController.protect,
  authController.restrictTo('student'),
  upload.single('file'),
  studentController.submitAssignment
);
router.get(
  '/submissions/:submissionId/files/:filename',
  authController.protect,
  studentController.downloadSubmissionFile
);
// Add these new routes at the end of your existing routes


router.get('/notifications', 
  authController.protect,
  authController.restrictTo('student'),
  (req, res, next) => {
    // Set CORS headers specifically for this endpoint
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
    next();
  },
  studentController.getStudentNotifications
);

router.patch('/notifications/:notificationId/read',
  authController.protect,
  authController.restrictTo('student'),
  studentController.markNotificationAsRead
);



router.get('/grades', protect, restrictTo('student'), studentController.getStudentGrades);
router.get('/messages', protect, studentController.getStudentMessages);

// Get single student
router.delete('/:id', studentController.deleteStudent);
router.get('/:id', studentController.getStudentById);

// Update student
router.put('/:id', upload.single('profilePicture'), studentController.updateStudent);

module.exports = router;
