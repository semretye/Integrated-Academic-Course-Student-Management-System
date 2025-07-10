const AssignedCourse = require('../models/AssignedCourse');
const Course = require('../models/Course');
const Instructor = require('../models/Instructure');

// Assign instructor to course
exports.assignInstructor = async (req, res) => {
  try {
    const { courseId, instructorId } = req.body;

    // Validate input
    if (!courseId || !instructorId) {
      return res.status(400).json({ error: 'Course ID and Instructor ID are required' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if instructor exists
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    // Check if assignment already exists
    const existingAssignment = await AssignedCourse.findOne({ 
      courseId: courseId 
    });
    
    if (existingAssignment) {
      return res.status(400).json({ 
        error: `Course is already assigned to ${existingAssignment.instructorId.name}` 
      });
    }

    // Create new assignment
    const newAssignment = new AssignedCourse({ 
      courseId, 
      instructorId 
    });

    await newAssignment.save();

    // Populate the response with names
    const populatedAssignment = await AssignedCourse.findById(newAssignment._id)
      .populate('courseId', 'name code')
      .populate('instructorId', 'name email');

    res.status(201).json({
      message: 'Instructor assigned successfully',
      assignment: {
        _id: populatedAssignment._id,
        courseName: populatedAssignment.courseId.name,
        courseCode: populatedAssignment.courseId.code,
        instructorName: populatedAssignment.instructorId.name,
        instructorEmail: populatedAssignment.instructorId.email
      }
    });

  } catch (error) {
    console.error('Assignment error:', error);
    res.status(500).json({ error: 'Server error during assignment' });
  }
};

// Get all assignments
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await AssignedCourse.find()
      .populate('courseId', 'name code')
      .populate('instructorId', 'name email');

    const formattedAssignments = assignments.map(item => ({
      _id: item._id,
      courseName: item.courseId?.name || 'Deleted Course',
      courseCode: item.courseId?.code || 'N/A',
      instructorName: item.instructorId?.name || 'Deleted Instructor',
      instructorEmail: item.instructorId?.email || 'N/A'
    }));

    res.status(200).json(formattedAssignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to retrieve assignments' });
  }
};

// Get all courses (for dropdown)
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({}, 'name code');
    res.status(200).json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to retrieve courses' });
  }
};

// Get all instructors (for dropdown)
exports.getAllInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.find({}, 'name email');
    res.status(200).json(instructors);
  } catch (error) {
    console.error('Get instructors error:', error);
    res.status(500).json({ error: 'Failed to retrieve instructors' });
  }
};
// ✅ DELETE AssignedCourse by ID
exports.deleteAssignedCourse = async (req, res) => {
  try {
    const deleted = await AssignedCourse.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    console.error('Error deleting assignment:', err);
    res.status(500).json({ message: 'Server error while deleting assignment' });
  }
};

// ✅ UPDATE AssignedCourse by ID
exports.updateAssignedCourse = async (req, res) => {
  const { id } = req.params;
  const { courseId, instructorId } = req.body;

  try {
    const updated = await AssignedCourse.findByIdAndUpdate(
      id,
      { courseId, instructorId },
      { new: true }
    ).populate('courseId instructorId');

    if (!updated) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({
      _id: updated._id,
      courseId: updated.courseId._id,
      instructorId: updated.instructorId._id,
      courseName: updated.courseId.name,
      courseCode: updated.courseId.code,
      instructorName: updated.instructorId.name,
    });
  } catch (err) {
    console.error('Error updating assignment:', err);
    res.status(500).json({ message: 'Server error while updating assignment' });
  }
};
