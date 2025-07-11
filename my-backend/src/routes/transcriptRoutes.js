const express = require('express');
const router = express.Router();

const transcriptController = require('../controllers/transcriptController');
const { authenticate } = require('../middlewares/authMiddleware');  // <-- destructured here

// Get transcript for a student in a course
router.get('/courses/:courseId/students', authenticate, transcriptController.getEnrolledStudents);

// Transcript routes
router.get('/courses/:courseId/students/:studentId/transcript', authenticate, transcriptController.getTranscript);
router.post('/courses/:courseId/students/:studentId/transcript', authenticate, transcriptController.updateTranscript);

router.get('/courses/:courseId/transcripts', authenticate, transcriptController.getCourseTranscripts);
router.get('/courses/:courseId/students/:studentId/transcript/download', authenticate, transcriptController.downloadTranscript);

module.exports = router;
