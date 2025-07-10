const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  credits: {
    type: Number,
    required: true
  },
  description: String
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);