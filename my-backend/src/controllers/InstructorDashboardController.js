const Instructure = require('../models/Instructure');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');

exports.getDashboardStats = async (req, res) => {
  try {
    // Verify database connection
    if (!mongoose.connection.readyState) {
      throw new Error('Database not connected');
    }

    // Get counts in parallel
    const [instructors, students, courses, pendingApprovals, pendingPayments] = await Promise.all([
      Instructure.countDocuments(),
      Student.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'pending' })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        instructures,
        students,
        courses,
        pendingApprovals,
        pendingPayments
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};