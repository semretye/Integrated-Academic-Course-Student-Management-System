const mongoose = require('mongoose');
const path = require('path');
require('./User'); 

const courseSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Course name is required'],
    trim: true,
    maxlength: [100, 'Course name cannot exceed 100 characters']
  },
  code: { 
    type: String, 
    required: [true, 'Course code is required'], 
    unique: true,
    uppercase: true,
    trim: true,
    // More flexible course code validation
    validate: {
      validator: function(v) {
        return /^[A-Z0-9-]{3,10}$/.test(v);
      },
      message: 'Course code should be 3-10 characters (letters, numbers, hyphens)'
    }
  },
  description: { 
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  duration: { 
    type: String, 
    required: [true, 'Duration is required'],
    enum: {
      values: ['1 month', '3 months', '6 months', '1 year'],
      message: 'Please select a valid duration'
    }
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function(instructorId) {
        if (!instructorId) return true; // Allow null/undefined
        const user = await mongoose.model('User').findById(instructorId);
        return user && user.role === 'instructor';
      },
      message: 'Invalid instructor or user is not an instructor'
    }
  },
students: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  validate: {
    validator: async function(id) {
      // Check both User and Student models
      const [user, student] = await Promise.all([
        mongoose.model('User').findById(id),
        mongoose.model('Student').findById(id)
      ]);
      
      // Return true if either is found with student role
      return (user && user.role === 'student') || 
             (student && student.role === 'student');
    },
    message: 'Invalid student ID or user is not a student'
  }
}]
,
  status: {
    type: String,
    enum: {
      values: ['active', 'archived', 'draft'],
      message: 'Invalid course status'
    },
    default: 'draft' // Changed default to draft
  },
  thumbnail: {
    type: String,
    default: '',
    validate: {
      validator: function(url) {
        // Accept empty string or paths starting with /uploads/
        return url === '' || url.startsWith('/uploads/');
      },
      message: 'Thumbnail must be an uploaded image path'
    }
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    validate: {
      validator: async function(courseIds) {
        if (!courseIds || courseIds.length === 0) return true;
        const courses = await mongoose.model('Course').find({ 
          _id: { $in: courseIds } 
        });
        return courses.length === courseIds.length;
      },
      message: 'Invalid prerequisite course IDs'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals for related data (unchanged)
courseSchema.virtual('schedules', {
  ref: 'Schedule',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

courseSchema.virtual('materials', {
  ref: 'Material',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

courseSchema.virtual('assignments', {
  ref: 'Assignment',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

// Indexes (unchanged)
courseSchema.index({ name: 'text', code: 'text', description: 'text' });
courseSchema.index({ instructor: 1, status: 1 });
courseSchema.index({ status: 1 });

// Cascade delete middleware (unchanged)
courseSchema.pre('remove', async function(next) {
  await Promise.all([
    mongoose.model('Schedule').deleteMany({ course: this._id }),
    mongoose.model('Material').deleteMany({ course: this._id }),
    mongoose.model('Assignment').deleteMany({ course: this._id }),
    mongoose.model('User').updateMany(
      { _id: { $in: this.students } },
      { $pull: { courses: this._id } }
    )
  ]);
  next();
});

// Update timestamp on save (unchanged)
courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static methods (unchanged)
courseSchema.statics.findByInstructor = function(instructorId) {
  return this.find({ instructor: instructorId })
    .populate('instructor', 'name email')
    .populate('students', 'name email')
    .populate('prerequisites', 'name code');
};

courseSchema.methods.getFullDetails = async function() {
  await this.populate([
    { path: 'instructor', select: 'name email' },
    { path: 'students', select: 'name email' },
    { path: 'prerequisites', select: 'name code' },
    { path: 'schedules' },
    { path: 'materials' },
    { path: 'assignments' }
  ]).execPopulate();
  return this;
};

module.exports = mongoose.model('Course', courseSchema);