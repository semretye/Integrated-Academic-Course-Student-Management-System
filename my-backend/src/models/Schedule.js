const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  title: { type: String, required: true },
  date: { type: String, required: true },  // you can store date/time in ISO string or Date type
  time: { type: String, required: true },
  meetingLink: { type: String },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
