const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

router.post('/courses/:courseId/schedule', scheduleController.createScheduledClass);
router.get('/courses/:courseId/schedule', scheduleController.getScheduledClassesByCourse);

module.exports = router;
