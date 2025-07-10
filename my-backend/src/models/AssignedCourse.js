const mongoose = require('mongoose');

const assignedCourseSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor',
    required: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexing for better performance
assignedCourseSchema.index({ courseId: 1, instructorId: 1 }, { unique: true });

module.exports = mongoose.model('AssignedCourse', assignedCourseSchema);