const express = require('express');
const router = express.Router();
const {
  assignInstructor,
  getAssignments,
  getAllCourses,
  getAllInstructors,
  deleteAssignedCourse,
  updateAssignedCourse
} = require('../controllers/AssignedCourseController');

// Assign instructor to course
router.post('/', assignInstructor);

// Get all assignments
router.get('/', getAssignments);

// Get all courses (for dropdown)
router.get('/courses', getAllCourses);

// Get all instructors (for dropdown)
router.get('/instructors', getAllInstructors);
router.delete('/:id', deleteAssignedCourse);

// ✅ PUT: update assigned instructor
router.put('/:id', updateAssignedCourse);


module.exports = router;