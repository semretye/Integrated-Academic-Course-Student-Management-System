const Course = require('../models/Course');
const Schedule = require('../models/Schedule');
const Material = require('../models/Material');
const Assignment = require('../models/Assignment');
const fs = require('fs');
const path = require('path');

// Get instructor courses with all details
exports.getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.params.instructorId;
    
    // Get all courses for this instructor
    const courses = await Course.find({ instructor: instructorId })
      .populate('instructor', 'name email')
      .populate('students', 'name email');

    // Get all related data for each course
    const coursesWithDetails = await Promise.all(courses.map(async course => {
      const [schedules, materials, assignments] = await Promise.all([
        Schedule.find({ course: course._id }),
        Material.find({ course: course._id }),
        Assignment.find({ course: course._id }).populate('submissions.student', 'name')
      ]);

      return {
        ...course.toObject(),
        id: course._id,
        schedule: schedules,
        materials: materials,
        assignments: assignments
      };
    }));

    res.status(200).json(coursesWithDetails);
  } catch (error) {
    console.error('Error getting instructor courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Schedule a new class
exports.scheduleClass = async (req, res) => {
  try {
    const { title, date, time, meetingLink } = req.body;
    const courseId = req.params.courseId;

    const newSchedule = new Schedule({
      title,
      date,
      time,
      meetingLink,
      course: courseId
    });

    await newSchedule.save();
    res.status(201).json(newSchedule);
  } catch (error) {
    console.error('Error scheduling class:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload course material
exports.uploadMaterial = async (req, res) => {
  try {
    const { title, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const newMaterial = new Material({
      title,
      description,
      filePath: file.path,
      course: req.params.courseId,
      uploadedBy: req.user.id
    });

    await newMaterial.save();
    res.status(201).json(newMaterial);
  } catch (error) {
    console.error('Error uploading material:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new assignment
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    const file = req.file;

    const newAssignment = new Assignment({
      title,
      description,
      filePath: file?.path || null,
      dueDate,
      course: req.params.courseId,
      createdBy: req.user.id
    });

    await newAssignment.save();
    res.status(201).json(newAssignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Download material file
exports.downloadMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    if (!fs.existsSync(material.filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(material.filePath);
  } catch (error) {
    console.error('Error downloading material:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Download assignment file
exports.downloadAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (!assignment.filePath || !fs.existsSync(assignment.filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(assignment.filePath);
  } catch (error) {
    console.error('Error downloading assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// At the bottom of your controller file

