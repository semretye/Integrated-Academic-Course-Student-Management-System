// src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middlewares/authMiddleware'); // Destructured import
const paymentController = require('../controllers/paymentController');

// Debugging check
console.log('Middleware type:', {
  authJWT: typeof authenticateJWT,
  initiateChapa: typeof paymentController.initiateChapa,
  chapaCallback: typeof paymentController.chapaCallback
});

// Routes
router.post('/initiate-chapa', authenticateJWT, paymentController.initiateChapa);
router.get('/chapa-callback', paymentController.chapaCallback);

module.exports = router;