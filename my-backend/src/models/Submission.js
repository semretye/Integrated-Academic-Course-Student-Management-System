const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  files: [{
    name: { type: String, required: true },
    path: { type: String, required: true },
     url: { type: String, required: true },
    size: { type: Number },
    mimetype: { type: String }
  }],
  textSubmission: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  grade: {
    type: Number,
    min: 0
  },
  feedback: String,
  gradedAt: Date,
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor'
  }
}, { timestamps: true });

// Indexes for better performance
submissionSchema.index({ assignment: 1 });
submissionSchema.index({ student: 1 });
submissionSchema.index({ course: 1 });
submissionSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);