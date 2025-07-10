// models/StudentProgress.js
const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  progress: {
    type: Number, // assuming 0-100 or 0.0–1.0
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('StudentProgress', studentProgressSchema);
