const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login (unified)
router.post('/login', authController.login);

// Registration (role-specific)
router.post('/register/student', authController.registerStudent);
router.post('/register/instructure', authController.registerInstructure);
router.post('/register/admin', authController.registerAdmin);

module.exports = router;