const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  course: {  // Changed to 'course' to match standard naming conventions
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Changed to 'User' to match your authentication system
    required: [true, 'Instructor reference is required']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual population
notificationSchema.virtual('courseDetails', {
  ref: 'Course',
  localField: 'course',
  foreignField: '_id',
  justOne: true
});

notificationSchema.virtual('instructorDetails', {
  ref: 'User',
  localField: 'postedBy',
  foreignField: '_id',
  justOne: true
});

// Indexes
notificationSchema.index({ course: 1 });
notificationSchema.index({ postedBy: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);