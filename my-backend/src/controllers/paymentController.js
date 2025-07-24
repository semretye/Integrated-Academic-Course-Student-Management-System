const axios = require('axios');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

// POST /api/payments/initiate-chapa
exports.initiateChapa = async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['courseId', 'amount', 'firstName', 'lastName', 'email'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const {
      courseId, 
      amount, 
      currency = 'ETB',
      firstName, 
      lastName, 
      email, 
      phone = 'N/A',
      returnUrl = `${process.env.FRONTEND_URL}/courses/${courseId}?payment=success`,
      cancelUrl = `${process.env.FRONTEND_URL}/courses/${courseId}?payment=cancel`
    } = req.body;

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Validate Chapa secret key
    const chapaSecret = process.env.CHAPA_SECRET_KEY;
    if (!chapaSecret) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway configuration error'
      });
    }

    const chapaUrl = 'https://api.chapa.co/v1/transaction/initialize';
    const txRef = `course-${courseId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create a temporary enrollment record
    const tempEnrollment = new Enrollment({
      course: courseId,
      student: req.user?.id || req.userId || req.body.userId, // Changed from req.userId to req.user.id
      paymentReference: txRef,
      amount: parseFloat(amount),
      status: 'pending',
      paymentMethod: 'chapa'
    });
    await tempEnrollment.save();

    const response = await axios.post(chapaUrl, {
      amount: amount.toString(),
      currency,
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      callback_url: returnUrl,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      reference: txRef,
      customization: {
        title: course.name,
        description: `Payment for ${course.name} course`
      }
    }, {
      headers: {
        Authorization: `Bearer ${chapaSecret}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000 // 15 seconds timeout
    });

    if (response.data?.status !== 'success' || !response.data?.data?.checkout_url) {
      await tempEnrollment.remove();
      return res.status(400).json({
        success: false,
        message: response.data?.message || 'Chapa initialization failed - no checkout URL received'
      });
    }

    return res.status(200).json({
      success: true,
      checkoutUrl: response.data.data.checkout_url,
      reference: txRef
    });

  } catch (err) {
    console.error('Chapa init error:', {
      error: err.message,
      stack: err.stack,
      response: err.response?.data
    });

    const errorMessage = err.response?.data?.message || 
      err.message || 
      'Payment initiation failed. Please try again.';

    return res.status(500).json({
      success: false,
      message: errorMessage,
      retryable: !err.response
    });
  }
};

// GET /api/payments/verify/:reference
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Find enrollment with course and student populated
    const enrollment = await Enrollment.findOne({ 
      paymentReference: reference,
      student: userId
    }).populate('course student');

    if (!enrollment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    // If already completed, return immediately
    if (enrollment.status === 'completed') {
      return res.status(200).json({
        success: true,
        status: 'completed',
        enrollment
      });
    }

    // Verify with Chapa
    const chapaSecret = process.env.CHAPA_SECRET_KEY;
    const verification = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${chapaSecret}` } }
    );

    if (verification.data?.status === 'success' && 
        verification.data?.data?.status === 'success') {
      
      // Update enrollment record
      enrollment.status = 'completed';
      enrollment.paymentDetails = verification.data.data;
      enrollment.completedAt = new Date();
      await enrollment.save();

      // Add course to student's enrolled courses
      await Student.findByIdAndUpdate(
        enrollment.student._id,
        { $addToSet: { enrolledCourses: enrollment.course._id } }
      );

      // Add student to course's students list
      await Course.findByIdAndUpdate(
        enrollment.course._id,
        { $addToSet: { students: enrollment.student._id } }
      );

      return res.status(200).json({
        success: true,
        status: 'completed',
        enrollment
      });
    }

    return res.status(200).json({
      success: true,
      status: 'pending',
      message: 'Payment not yet completed'
    });

  } catch (err) {
    console.error('Verify payment error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
};

// GET /api/payments/chapa-callback
exports.chapaCallback = async (req, res) => {
  try {
    const { tx_ref, status } = req.query;

    if (!tx_ref) {
      console.error('Callback missing transaction reference');
      return res.redirect('/payment-failed?error=missing_reference');
    }

    // Find enrollment with populated course and student
    const enrollment = await Enrollment.findOne({ 
      paymentReference: tx_ref 
    }).populate('course student');

    if (!enrollment) {
      console.error('Enrollment record not found for reference:', tx_ref);
      return res.redirect('/payment-failed?error=invalid_reference');
    }

    if (status === 'success') {
      // Verify with Chapa
      const chapaSecret = process.env.CHAPA_SECRET_KEY;
      const verification = await axios.get(
        `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
        { headers: { Authorization: `Bearer ${chapaSecret}` } }
      );

      if (verification.data?.status === 'success') {
        // Update enrollment
        enrollment.status = 'completed';
        enrollment.paymentDetails = verification.data.data;
        enrollment.completedAt = new Date();
        await enrollment.save();

        // Update student and course
        await Student.findByIdAndUpdate(
          enrollment.student._id,
          { $addToSet: { enrolledCourses: enrollment.course._id } }
        );
        
        await Course.findByIdAndUpdate(
          enrollment.course._id,
          { $addToSet: { students: enrollment.student._id } }
        );

        return res.redirect(`${process.env.FRONTEND_URL}/courses/${enrollment.course._id}?payment=success`);
      } else {
        enrollment.status = 'failed';
        enrollment.paymentDetails = verification.data?.data || { error: 'Verification failed' };
        await enrollment.save();
        
        return res.redirect(`${process.env.FRONTEND_URL}/courses/${enrollment.course._id}?payment=failed`);
      }
    } else {
      // Payment failed or cancelled
      enrollment.status = 'failed';
      enrollment.paymentDetails = { status: 'failed', reason: status };
      await enrollment.save();

      return res.redirect(`${process.env.FRONTEND_URL}/courses/${enrollment.course._id}?payment=cancelled`);
    }
  } catch (err) {
    console.error('Callback error:', {
      error: err.message,
      stack: err.stack,
      query: req.query
    });

    return res.redirect('/payment-failed?error=server_error');
  }
};