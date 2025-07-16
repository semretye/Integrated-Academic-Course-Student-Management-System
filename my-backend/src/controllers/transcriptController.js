const Transcript = require('../models/Transcript');
const Course = require('../models/Course');
const User = require('../models/User');
const { calculateFinalGrade } = require('../utils/gradeCalculator');
const PDFDocument = require('pdfkit');

exports.updateTranscript = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { assignments, remarks } = req.body;

    if (!Array.isArray(assignments)) {
      return res.status(400).json({ success: false, message: 'Assignments must be an array' });
    }

    // Calculate final grade based on assignments
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
      success: true,
      message: 'Transcript updated successfully',
      transcript
    });
  } catch (err) {
    console.error('Error in updateTranscript:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCourseTranscripts = async (req, res) => {
  try {
    const transcripts = await Transcript.find({
      course: req.params.courseId
    }).populate('student', 'name email studentId');

    res.json({
      success: true,
      transcripts
    });
  } catch (err) {
    console.error('Error in getCourseTranscripts:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEnrolledStudents = async (req, res) => {
  try {
    // Check if course exists
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    // Populate students with necessary fields
    const populatedCourse = await Course.findById(req.params.courseId)
      .populate({
        path: 'students',
        select: '_id firstName lastName email studentId', // Include all needed fields
        model: 'Student' // Make sure this matches your model name
      });

    if (!populatedCourse.students || populatedCourse.students.length === 0) {
      return res.status(200).json({ 
        success: true,
        data: [], // Consistent response format
        message: 'No students enrolled in this course yet'
      });
    }

    // Format student data consistently
    const students = populatedCourse.students.map(student => ({
      _id: student._id,
      studentId: student.studentId,
      name: `${student.firstName} ${student.lastName}`,
      email: student.email
    }));

    res.status(200).json({
      success: true,
      data: students, // Consistent response format
      count: students.length
    });

  } catch (err) {
    console.error('Error in getEnrolledStudents:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching students',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.getTranscript = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let transcript = await Transcript.findOne({
      course: req.params.courseId,
      student: req.params.studentId
    })
    .populate('student', 'name studentId')
    .populate('course', 'name code');

    // If no transcript exists, create one
    if (!transcript) {
      transcript = await Transcript.create({
        course: req.params.courseId,
        student: req.params.studentId,
        assignments: [],
        lastUpdatedBy: req.user.id
      });
      
      // Repopulate after creation
      transcript = await Transcript.findById(transcript._id)
        .populate('student', 'name studentId')
        .populate('course', 'name code');
    }

    // Authorization check
    const isTeacher = req.user.role === 'teacher';
    const isOwner = transcript.student._id.equals(req.user.id);

    if (!isTeacher && !isOwner) {
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
    console.error('Error in getTranscript:', err);
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
      return res.status(404).json({ success: false, message: 'Transcript not found' });
    }

    const doc = new PDFDocument();
    const filename = `transcript_${transcript.course.code}_${transcript.student.studentId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    doc.fontSize(20).text('Semret Tech School', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text('Official Transcript', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).text(`Student: ${transcript.student.name} (${transcript.student.studentId})`);
    doc.text(`Course: ${transcript.course.name} (${transcript.course.code})`);
    doc.moveDown();

    doc.fontSize(12).text('Assignments:', { underline: true });
    doc.moveDown(0.5);

    // Table header
    doc.text('Assignment', 50, doc.y);
    doc.text('Score', 250, doc.y);
    doc.text('Weight', 350, doc.y);
    doc.text('Grade', 450, doc.y);
    doc.moveDown(0.5);

    if (Array.isArray(transcript.assignments)) {
      transcript.assignments.forEach(assignment => {
        doc.text(assignment.name, 50);
        doc.text(`${assignment.score}/${assignment.maxScore} (${assignment.percentage}%)`, 250);
        doc.text(`${assignment.weight}%`, 350);
        doc.text(calculateLetterGrade(assignment.percentage), 450);
        doc.moveDown(0.5);
      });
    }

    doc.moveDown();
    doc.text(`Final Grade: ${transcript.finalGrade} (${transcript.finalPercentage}%)`, { bold: true });
    doc.text(`Grade Points: ${transcript.gradePoints.toFixed(1)}`);
    doc.moveDown();
    doc.text(`Remarks: ${transcript.remarks}`);

    doc.end();
  } catch (err) {
    console.error('Error in downloadTranscript:', err);
    res.status(500).json({ success: false, message: err.message });
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
