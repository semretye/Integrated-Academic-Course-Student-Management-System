const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  grade: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  feedback: {
    type: String,
    default: ''
  },
  gradedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Grade', gradeSchema);
