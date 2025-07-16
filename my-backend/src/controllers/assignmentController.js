const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const AssignedCourse = require('../models/AssignedCourse');

const fs = require('fs');
const path = require('path');

// Create assignment
exports.createAssignment = async (req, res) => {
  const { courseId } = req.params;
  const { title, description, dueDate, totalPoints } = req.body;
  const filePath = req.file ? req.file.path : null;

  try {
    const assignment = new Assignment({
      courseId,
      title,
      description,
      dueDate,
      totalPoints,
      filePath : req.file?.path,
        originalFileName: req.file?.originalname 
    });

    const saved = await assignment.save();
    res.status(201).json({ success: true, assignment: saved });
  } catch (err) {
    console.error('Create Assignment Error:', err);
    res.status(500).json({ message: 'Server error creating assignment.' });
  }
};

exports.getAssignmentsByCourse = async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user?.id; // Assuming student ID is in the JWT token\\
  try {
    const assignments = await Assignment.find({ courseId });

    // Fetch all submissions for the given student and these assignments
    const submissions = await Submission.find({
      assignment: { $in: assignments.map(a => a._id) },
      student: studentId
    });

    // Map assignments and attach submission status
    const processedAssignments = assignments.map((a) => {
      const submission = submissions.find(s => s.assignment.equals(a._id));

      // Assignment file URL
      const fileUrl = a.filePath
        ? `/api/assignments/files/${a.filePath.split('/').pop()}`
        : null;

      // Submission file URL and name (only first file for now)
      let submissionFileUrl = null;
      let submissionFileName = null;

      if (submission?.files?.length > 0) {
        const firstFile = submission.files[0];
        submissionFileUrl = `/api/submissions/files/${submission._id}/${firstFile.path.split('/').pop()}`;
        submissionFileName = firstFile.name;
      }

      return {
        _id: a._id,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
        totalPoints: a.totalPoints,
        submitted: !!submission,
        graded: submission?.grade !== undefined && submission?.grade !== null,
        grade: submission?.grade ?? null,
        feedback: submission?.feedback ?? null,
        files: a.filePath ? [{
          url: fileUrl,
          name: a.originalFileName || 'assignment.pdf',
          mimetype: 'application/pdf'
        }] : [],
        submission: submission ? {
          fileUrl: submissionFileUrl,
          fileName: submissionFileName,
          submittedAt: submission.submittedAt,
          grade: submission.grade ?? null,
          feedback: submission.feedback ?? null
        } : null
      };
    });

    res.json(processedAssignments);
  } catch (err) {
    console.error('Fetch Assignments Error:', err);
    res.status(500).json({ message: 'Failed to fetch assignments.' });
  }
};

exports.downloadAssignmentFile = async (req, res) => {
  try {
    // Verify authentication
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { filename } = req.params;
    
    // Security: Validate filename
    if (!filename.match(/^[a-zA-Z0-9\-_\.]+$/)) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    // Check database for assignment with this file
    const assignment = await Assignment.findOne({ 
      $or: [
        { filePath: { $regex: filename } },
        { originalFileName: filename }
      ]
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found for this file' });
    }

    // Verify file exists
    const filePath = path.join(__dirname, '../../uploads/materials', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set proper download headers
    const downloadName = assignment.originalFileName || filename;
    res.set({
      'Content-Disposition': `attachment; filename="${downloadName}"`,
      'Content-Type': getMimeType(path.extname(filePath))
    });

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      res.status(500).json({ message: 'Error streaming file' });
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error during download' });
  }
};

// Helper function to get MIME type
function getMimeType(ext) {
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.zip': 'application/zip'
  };
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

exports.getAssignmentsForInstructor = async (req, res) => {
  const { courseId } = req.params;

  try {
    // Verify instructor is assigned to this course
    const isAssigned = await AssignedCourse.findOne({
      courseId,
      instructorId: req.user._id
    });

    if (!isAssigned) {
      return res.status(403).json({ 
        message: 'Not authorized to view assignments for this course' 
      });
    }

    const assignments = await Assignment.find({ courseId })
      .lean()
      .sort({ dueDate: 1 });

    // Get submission counts for each assignment
    const assignmentsWithSubmissions = await Promise.all(
      assignments.map(async (a) => {
        const submissionCount = await Submission.countDocuments({ 
          assignment: a._id 
        });
        
        const fileInfo = a.filePath ? {
          path: a.filePath,
          url: `/api/assignments/files/${a.filePath.split('/').pop()}`,
          name: a.originalFileName || a.filePath.split('/').pop(),
          type: a.filePath.split('.').pop().toLowerCase()
        } : null;

        return {
          ...a,
          file: fileInfo,
          fileType: fileInfo?.type,
          submissionCount
        };
      })
    );

    res.json(assignmentsWithSubmissions);
  } catch (err) {
    console.error('Fetch Instructor Assignments Error:', err);
    res.status(500).json({ message: 'Failed to fetch assignments.' });
  }
};


// Get single assignment
exports.downloadAssignmentFile = async (req, res) => {
  try {
    // Verify authentication
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { filename } = req.params;
    
    // Verify filename is safe
    if (!filename.match(/^[a-zA-Z0-9\-_\.]+$/)) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    const filePath = path.join(__dirname, '../../uploads/materials', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath, filename);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getAssignmentById = async (req, res) => {
  const { assignmentId } = req.params;

  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }
    res.json(assignment);
  } catch (err) {
    console.error('Fetch Assignment Error:', err);
    res.status(500).json({ message: 'Failed to fetch assignment.' });
  }
};

// Update assignment
exports.updateAssignment = async (req, res) => {
  const { assignmentId } = req.params;
  const updates = req.body;

  if (req.file) {
    updates.filePath = req.file.path;
  }

  try {
    const updated = await Assignment.findByIdAndUpdate(assignmentId, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }
    res.json({ success: true, assignment: updated });
  } catch (err) {
    console.error('Update Assignment Error:', err);
    res.status(500).json({ message: 'Failed to update assignment.' });
  }
};

// Delete assignment
exports.deleteAssignment = async (req, res) => {
  const { assignmentId } = req.params;

  try {
    const deleted = await Assignment.findByIdAndDelete(assignmentId);
    if (!deleted) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete Assignment Error:', err);
    res.status(500).json({ message: 'Failed to delete assignment.' });
  }
};
exports.updateAssigned = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const updated = await Material.findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Material not found' });

    res.json({ success: true, message: 'Updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

exports.deleteAssigned = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findById(id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    // Delete file from disk
    if (material.filePath && fs.existsSync(material.filePath)) {
      fs.unlinkSync(material.filePath);
    }

    await Material.findByIdAndDelete(id);
    res.json({ success: true, message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};
// Fetch submissions for an assignment
exports.getSubmissionsForAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Verify the requesting instructor is assigned to this course
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    const isAssigned = await AssignedCourse.findOne({
      courseId: assignment.courseId,
      instructorId: req.user._id
    });

    if (!isAssigned) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to view these submissions' 
      });
    }

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'firstName lastName email')
      .populate('assignment', 'title totalPoints')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Grade a submission - FULL IMPLEMENTATION
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    // Validate required fields
    if (grade === undefined || grade === null) {
      return res.status(400).json({ 
        success: false,
        message: 'Grade is required' 
      });
    }

    const submission = await Submission.findById(submissionId)
      .populate('assignment');

    if (!submission) {
      return res.status(404).json({ 
        success: false,
        message: 'Submission not found' 
      });
    }

    // Verify the requesting instructor is assigned to this course
    const assignment = await Assignment.findById(submission.assignment);
    const isAssigned = await AssignedCourse.findOne({
      courseId: assignment.courseId,
      instructorId: req.user._id
    });

    if (!isAssigned) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to grade this submission' 
      });
    }

    // Validate grade doesn't exceed total points
    if (grade > submission.assignment.totalPoints) {
      return res.status(400).json({
        success: false,
        message: `Grade cannot exceed ${submission.assignment.totalPoints}`
      });
    }

    // Update submission
    submission.grade = grade;
    submission.feedback = feedback || '';
    submission.gradedAt = new Date();
    submission.gradedBy = req.user._id;

    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grade submission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Download a submitted file
exports.downloadSubmissionFile = async (req, res) => {
  try {
    const { submissionId, filename } = req.params;

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ 
        success: false,
        message: 'Submission not found' 
      });
    }

    // Authorization checks
    if (req.user.role === 'student' && 
        submission.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to access this file' 
      });
    }

    if (req.user.role === 'instructor') {
      const assignment = await Assignment.findById(submission.assignment);
      const isAssigned = await AssignedCourse.findOne({
        courseId: assignment.courseId,
        instructorId: req.user._id
      });

      if (!isAssigned) {
        return res.status(403).json({ 
          success: false,
          message: 'Not authorized to access this file' 
        });
      }
    }

    // Find the requested file
    const file = submission.files.find(f => f.name === filename);
    if (!file) {
      return res.status(404).json({ 
        success: false,
        message: 'File not found in submission' 
      });
    }

    const filePath = path.join(__dirname, '../../uploads', file.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false,
        message: 'File not found on server' 
      });
    }

    res.download(filePath, filename);
  } catch (error) {
    console.error('Error downloading submission file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }};
