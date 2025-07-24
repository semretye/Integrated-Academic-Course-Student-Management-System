const Course = require('../models/Course');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const Material = require('../models/Material');
const Assignment = require('../models/Assignment');
const mongoose = require('mongoose');
const Student = require('../models/Student'); 
const StudentProgress = require('../models/StudentProgress');
const fs = require('fs');
const db = require('../config/db');
const path = require('path');
const multer = require('multer');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/courses/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Multer middleware
exports.upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .jpg, .png files are allowed'));
    }
  }
});
exports.getCourseMaterials = async (req, res) => {
  try {
    const courseId = req.params.id;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    // Find materials for the course
    const materials = await Material.find({ course: courseId });

    res.json({
      success: true,
      data: materials
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ message: 'Failed to fetch materials' });
  }
};

exports.getCourseSchedule = async (req, res) => {
  const courseId = req.params.courseId;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ message: 'Invalid course ID format' });
  }

  try {
    const scheduleItems = await Schedule.find({ courseId }).sort({ date: 1 });

    res.status(200).json({
      message: 'Schedule fetched successfully',
      data: scheduleItems
    });
  } catch (err) {
    console.error('Error fetching schedule:', err);
    res.status(500).json({ message: 'Failed to fetch schedule' });
  }
};

exports.getCourseStats = async (req, res) => {
  const courseId = req.params.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    const total_students = await Student.countDocuments({ enrolledCourses: courseId });
    const total_assignments = await Assignment.countDocuments({ course: courseId });
    const total_materials = await Material.countDocuments({ course: courseId });

    // Example: assuming you have a StudentProgress model (you might need to adjust this!)
    const StudentProgress = mongoose.model('StudentProgress'); // or require('../models/StudentProgress');
    const progressDocs = await StudentProgress.find({ course: courseId });

    let completionRate = 0;
    if (progressDocs.length > 0) {
      const totalProgress = progressDocs.reduce((sum, doc) => sum + doc.progress, 0);
      completionRate = Math.round(totalProgress / progressDocs.length);
    }

    res.json({
      students: total_students || 0,
      assignments: total_assignments || 0,
      materials: total_materials || 0,
      completionRate: completionRate || 0
    });

  } catch (err) {
    console.error('Error fetching course stats:', err);
    res.status(500).json({ message: 'Error fetching course stats' });
  }
};

// Create new course
exports.getTeacherCourses = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    
    // Find courses where the teacher is the instructor
    const courses = await Course.find({ instructor: teacherId })
      .populate('instructor', 'name email')
      .populate('students', 'name email');
    
    // For each course, get schedules, materials, and assignments
    const coursesWithDetails = await Promise.all(courses.map(async course => {
      const schedules = await Schedule.find({ course: course._id });
      const materials = await Material.find({ course: course._id });
      const assignments = await Assignment.find({ course: course._id });
      
      return {
        ...course._doc,
        schedule: schedules,
        materials: materials,
        assignments: assignments
      };
    }));
    
    res.json(coursesWithDetails);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
exports.getCourseById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid course ID format' });
  }

  try {
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.createCourse = async (req, res) => {
  try {
    const { name, code, description, duration,price } = req.body;
    const thumbnail = req.file ? `/uploads/courses/${req.file.filename}` : '';

    if (!name || !code || !duration|| price == null) {
      return res.status(400).json({ message: 'Name, code,price and duration are required' });
    }

    const existing = await Course.findOne({ code });
    if (existing) {
      return res.status(409).json({ message: 'Course code already exists' });
    }

    const course = new Course({
      name,
      code,
      description,
      duration,
      thumbnail,
       price,
      // No instructor assigned initially
      status: 'active' // You might want to set this as draft initially
    });

    await course.save();
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    console.error('Course creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



// (Optional) Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
};
exports.updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { name, code, description, duration,price } = req.body;

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { name, code, description, duration,price },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course updated successfully', course: updatedCourse });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    const deletedCourse = await Course.findByIdAndDelete(courseId);
    if (!deletedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getAvailableCourses = async (req, res) => {
  try {
    console.log('Authenticated user ID:', req.user.id); // Debug 1
    console.log('User object:', req.user); // Debug 2
    
    const courses = await Course.find({
      students: { $nin: [req.user.id] }, // Courses where student is not enrolled
      status: 'active' // Only active courses
    })
    .populate('instructor', 'firstName lastName')
    .select('-students -materials -assignments');

    console.log('Found courses:', courses); // Debug 3

    res.json({
      success: true,
      data: courses
    });
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: err.message
    });
  }
};

// Enroll student in course
exports.enrollStudent = async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // 1. Verify user exists and is a student
    let user;
    if (userRole === 'student') {
      user = await mongoose.model('Student').findById(userId);
    } else {
      user = await mongoose.model('User').findById(userId);
    }

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        reason: 'USER_NOT_FOUND'
      });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ 
        message: 'Only students can enroll',
        reason: 'NOT_A_STUDENT'
      });
    }

    // 2. Check course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // 3. Check if already enrolled
    if (course.students.some(id => id.toString() === userId)) {
      return res.status(400).json({ message: 'Already enrolled' });
    }

    // 4. Perform enrollment without transaction
    // Add student to course
    course.students.push(userId);
    await course.save();

    // Add course to user's enrolled list
    if (userRole === 'student') {
      await mongoose.model('Student').findByIdAndUpdate(
        userId,
        { $addToSet: { enrolledCourses: courseId } }
      );
    } else {
      await mongoose.model('User').findByIdAndUpdate(
        userId,
        { $addToSet: { courses: courseId } }
      );
    }

    res.json({
      success: true,
      message: 'Enrolled successfully',
      courseId: course._id
    });

  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({
      success: false,
      message: 'Enrollment failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};