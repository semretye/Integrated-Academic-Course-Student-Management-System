// models/Transcript.js
const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  assignments: [
    {
      name: String,
      score: Number,
      maxScore: Number,
      weight: Number,
      percentage: Number
    }
  ],
  finalGrade: String,
  gradePoints: Number,
  finalPercentage: Number,
  remarks: String,
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Transcript', transcriptSchema);
