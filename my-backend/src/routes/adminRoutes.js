const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Register admin or manager
router.post('/register', adminController.registerAdmin);

// Get all admins and managers
router.get('/all', adminController.getAllAdmins);

// Delete admin by ID
router.delete('/:id', adminController.deleteAdmin);
router.put('/:id', adminController.updateAdmin);

module.exports = router;
