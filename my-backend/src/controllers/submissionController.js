const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// List submissions of the logged-in student, optional filter by courseId
const formatSubmissionResponse = (submission) => {
  // Ensure files array exists with consistent structure
  const files = submission.files?.length > 0 
    ? submission.files.map(file => ({
        url: file.url || `/uploads/submissions/${path.basename(file.path)}`,
        path: file.path,
        name: file.name || 'submission.pdf',
        size: file.size,
        mimetype: file.mimetype
      }))
    : submission.url
      ? [{
          url: submission.url,
          path: submission.path,
          name: submission.fileName || 'submission.pdf',
          size: submission.size,
          mimetype: submission.mimetype
        }]
      : [];

  return {
    ...submission.toObject(),
    files
  };
};

exports.getSubmissionsByStudent = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { courseId } = req.query;

    // Validate courseId if provided
    if (courseId && !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid courseId' });
    }

    const filter = { student: studentId };
    if (courseId) filter.course = courseId;

    const submissions = await Submission.find(filter)
      .populate('assignment', 'title dueDate')
      .populate('course', 'name code')
      .sort({ submittedAt: -1 });
    
    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get submissions' });
  }
};

// Submit or resubmit an assignment with multiple files and optional text submission
exports.submitAssignment = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { assignmentId } = req.params; // Get from URL params
    const { courseId, textSubmission } = req.body; // Get from form data

    // Validate assignment ID
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid assignment ID format' 
      });
    }

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found' 
      });
    }

    // Validate due date
    const now = new Date();
    if (new Date(assignment.dueDate) < now) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot submit after due date' 
      });
    }

    // Process files
    const files = req.files?.map(file => ({
      name: file.originalname,
      path: file.path,
      url: `/api/submissions/files/${file.filename}`, // Consistent API endpoint
      size: file.size,
      mimetype: file.mimetype,
      type: file.mimetype.split('/')[0] // e.g., 'application/pdf' -> 'application'
    })) || [];

    // Validate at least one file or text submission
    if (files.length === 0 && !textSubmission) {
      return res.status(400).json({ 
        success: false, 
        message: 'Either file or text submission is required' 
      });
    }

    // Find or create submission
    let submission = await Submission.findOneAndUpdate(
      { assignment: assignmentId, student: studentId },
      {
        $set: {
          files,
          textSubmission,
          submittedAt: now,
          // Reset grading info if resubmitting
          $unset: {
            grade: 1,
            feedback: 1,
            gradedAt: 1,
            gradedBy: 1
          }
        }
      },
      { new: true, upsert: true }
    );

    // Prepare response data
    const responseData = {
      _id: submission._id,
      assignment: submission.assignment,
      student: submission.student,
      submittedAt: submission.submittedAt,
      files: submission.files.map(file => ({
        name: file.name,
        url: file.url,
        type: file.type,
        size: file.size
      })),
      textSubmission: submission.textSubmission
    };

    res.status(200).json({ 
      success: true, 
      message: 'Assignment submitted successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Submission error:', error);
    
    // Handle specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error',
        errors: error.errors 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit assignment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
exports.getStudentSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user._id;

    const submission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId
    })
    .populate('assignment', 'title description dueDate totalPoints files')
    .populate('course', 'name code');

    if (!submission) {
      return res.status(204).send(); // No Content
    }

    // Format response to clearly separate assignment and submission files
    const response = {
      _id: submission._id,
      assignment: {
        _id: submission.assignment._id,
        title: submission.assignment.title,
        description: submission.assignment.description,
        dueDate: submission.assignment.dueDate,
       files: Array.isArray(submission.assignment.files) 
  ? submission.assignment.files.map(file => ({
      url: file.url,
      name: file.name,
      type: file.mimetype
    })) 
  : []

      },
      submittedAt: submission.submittedAt,
     files: Array.isArray(submission.files) 
  ? submission.files.map(file => ({
      url: file.url,
      name: file.name,
      type: file.mimetype
    })) 
  : [],
      grade: submission.grade,
      feedback: submission.feedback
    };

    res.status(200).json({ 
      success: true, 
      data: response 
    });
  } catch (error) {
    console.error('Fetch submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch submission' 
    });
  }
};

exports.getStudentSubmissionsForCourse = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { courseId } = req.params;

    const submissions = await Submission.find({
      student: studentId,
      course: courseId
    })
    .populate('assignment', 'title description dueDate totalPoints')
    .sort({ submittedAt: -1 });

    res.status(200).json({ 
      success: true, 
      data: submissions 
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch submissions' 
    });
  }
};
// Download a file from a submission by file index or name
exports.downloadSubmissionFile = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { submissionId, fileIndex } = req.params;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ success: false, message: 'Invalid submissionId' });
    }

    const submission = await Submission.findOne({ _id: submissionId, student: studentId });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found or access denied' });
    }

    // Check fileIndex (number)
    const index = parseInt(fileIndex);
    if (isNaN(index) || index < 0 || index >= submission.files.length) {
      return res.status(400).json({ success: false, message: 'Invalid file index' });
    }

    const fileData = submission.files[index];
    const absolutePath = path.resolve(fileData.path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    res.download(absolutePath, fileData.name);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ success: false, message: 'Failed to download file' });
  }
};
exports.getAssignmentsWithSubmissions = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { courseId } = req.params;

    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid courseId' });
    }

    // Find all assignments for the course
    const assignments = await Assignment.find({ courseId })
      .sort({ dueDate: 1 });

    // Find all submissions for these assignments by this student
    const submissions = await Submission.find({
      student: studentId,
      assignment: { $in: assignments.map(a => a._id) }
    });

    // Combine the data
    const assignmentsWithStatus = assignments.map(assignment => {
      const submission = submissions.find(s => s.assignment.equals(assignment._id));
      
      return {
        ...assignment.toObject(),
        submission: submission ? {
          _id: submission._id,
          submittedAt: submission.submittedAt,
          files: submission.files,
          textSubmission: submission.textSubmission,
          grade: submission.grade,
          feedback: submission.feedback
        } : null
      };
    });

    res.status(200).json({ success: true, data: assignmentsWithStatus });
  } catch (error) {
    console.error('Error getting assignments:', error);
    res.status(500).json({ success: false, message: 'Failed to get assignments' });
  }
};
exports.getSubmissionByAssignmentAndStudent = async (req, res) => {
  try {
    const studentId = req.user._id;
    const assignmentId = req.params.assignmentId;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid assignmentId' });
    }

    const submission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId
    })
    .populate('assignment', 'title dueDate courseId')
    .populate('course', 'name code');

    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: 'No submission found for this assignment' 
      });
    }

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to get submission' });
  }
};
exports.updateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Delete old file if exists
    if (submission.fileUrl) {
      const oldFilePath = path.join(__dirname, '..', submission.fileUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update submission
    submission.fileUrl = `/uploads/${file.filename}`;
    submission.fileName = file.originalname;
    submission.submittedAt = new Date();
    await submission.save();

    res.status(200).json({ 
      success: true, 
      message: 'Submission updated successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ success: false, message: 'Failed to update submission' });
  }
};

// Delete a submission
exports.deleteSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Delete file if exists
    if (submission.fileUrl) {
      const filePath = path.join(__dirname, '..', submission.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Submission.findByIdAndDelete(submissionId);

    res.status(200).json({ 
      success: true, 
      message: 'Submission deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ success: false, message: 'Failed to delete submission' });
  }
};
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId, studentId, courseId } = req.body;
    const file = req.file; // This comes from Multer

    // Validate required fields
    if (!assignmentId || !studentId || !courseId || !file) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check for existing submission
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this assignment'
      });
    }

    // Create new submission using Multer's file info
    const submission = new Submission({
      assignment: assignmentId,
      student: studentId,
      course: courseId,
      submittedAt: new Date(),
       url: `/uploads/submissions/${file.filename}`,
       // Path matches Multer config
      fileName: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    await submission.save();

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission
    });

  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getSubmissionByAssignmentAndStudent = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { assignmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid assignmentId' });
    }

    const submission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId
    })
    .populate('assignment', 'title dueDate totalPoints description')
    .populate('course', 'name code');

    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: 'No submission found for this assignment' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: submission 
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get submission' 
    });
  }
};


