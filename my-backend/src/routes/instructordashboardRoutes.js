const express = require('express');
const router = express.Router();
const instructorDashboardController = require('../controllers/InstructorDashboardController');
const authController = require('../controllers/authController');

// Protect all routes after this middleware
router.use(authController.protect);

// Get dashboard statistics
router.get('/stats', instructorDashboardController.getDashboardStats);

module.exports = router;