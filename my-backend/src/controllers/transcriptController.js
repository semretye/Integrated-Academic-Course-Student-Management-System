const Transcript = require('../models/Transcript');
const Course = require('../models/Course');
const User = require('../models/User');
const { calculateFinalGrade } = require('../utils/gradeCalculator');
const PDFDocument = require('pdfkit');

exports.getTranscript = async (req, res) => {
  try {
    const transcript = await Transcript.findOne({
      course: req.params.courseId,
      student: req.params.studentId
    }).populate('student course');

    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }

    // Only allow student or teacher to access
    if (req.user.role !== 'teacher' && req.user.id !== transcript.student._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(transcript);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTranscript = async (req, res) => {
  try {
    const { assignments, remarks } = req.body;
    
    // Validate assignments
    if (!Array.isArray(assignments)) {
      return res.status(400).json({ message: 'Assignments must be an array' });
    }

    // Calculate final grade
    const finalGradeData = calculateFinalGrade(assignments);

    const transcript = await Transcript.findOneAndUpdate(
      {
        course: req.params.courseId,
        student: req.params.studentId
      },
      {
        assignments,
        finalGrade: finalGradeData.letterGrade,
        gradePoints: finalGradeData.points,
        finalPercentage: finalGradeData.percentage,
        remarks,
        lastUpdatedBy: req.user.id
      },
      { new: true, upsert: true }
    ).populate('student course');

    res.json({
      message: 'Transcript updated successfully',
      transcript
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCourseTranscripts = async (req, res) => {
  try {
    const transcripts = await Transcript.find({
      course: req.params.courseId
    }).populate('student', 'name email studentId');

    res.json(transcripts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getEnrolledStudents = async (req, res) => {
  try {
    // First check if course exists
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    // Then get students with full population
    const populatedCourse = await Course.findById(req.params.courseId)
      .populate({
        path: 'students',
        select: 'name email studentId _id',
        model: 'User'
      });

    // Debug logging
    console.log('Populated course students:', populatedCourse.students);

    res.json({
      success: true,
      count: populatedCourse.students.length,
      students: populatedCourse.students || []
    });
  } catch (err) {
    console.error('Error in getEnrolledStudents:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};
// Update your existing endpoints to use consistent response format
exports.getTranscript = async (req, res) => {
  try {
    const transcript = await Transcript.findOne({
      course: req.params.courseId,
      student: req.params.studentId
    })
    .populate('student', 'name studentId')
    .populate('course', 'name code');

    if (!transcript) {
      return res.status(404).json({ 
        success: false,
        message: 'Transcript not found' 
      });
    }

    // Authorization check
    if (req.user.role !== 'teacher' && req.user.id !== transcript.student._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized access' 
      });
    }

    res.json({
      success: true,
      transcript
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

exports.downloadTranscript = async (req, res) => {
  try {
    const transcript = await Transcript.findOne({
      course: req.params.courseId,
      student: req.params.studentId
    }).populate('student course');

    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }

    // Create PDF
    const doc = new PDFDocument();
    const filename = `transcript_${transcript.course.code}_${transcript.student.studentId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('Semret Tech School', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text('Official Transcript', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).text(`Student: ${transcript.student.name} (${transcript.student.studentId})`);
    doc.text(`Course: ${transcript.course.name} (${transcript.course.code})`);
    doc.moveDown();

    // Add assignments table
    doc.fontSize(12).text('Assignments:', { underline: true });
    doc.moveDown(0.5);

    // Table header
    doc.text('Assignment', 50, doc.y);
    doc.text('Score', 250, doc.y);
    doc.text('Weight', 350, doc.y);
    doc.text('Grade', 450, doc.y);
    doc.moveDown(0.5);

    // Table rows
    transcript.assignments.forEach(assignment => {
      doc.text(assignment.name, 50);
      doc.text(`${assignment.score}/${assignment.maxScore} (${assignment.percentage}%)`, 250);
      doc.text(`${assignment.weight}%`, 350);
      doc.text(calculateLetterGrade(assignment.percentage), 450);
      doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.text(`Final Grade: ${transcript.finalGrade} (${transcript.finalPercentage}%)`, { bold: true });
    doc.text(`Grade Points: ${transcript.gradePoints.toFixed(1)}`);
    doc.moveDown();
    doc.text(`Remarks: ${transcript.remarks}`);

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function calculateLetterGrade(percentage) {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}