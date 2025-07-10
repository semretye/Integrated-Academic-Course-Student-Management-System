const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'teacher', 'student'],
    default: 'student'
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
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

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static methods
userSchema.statics.ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TEACHER: 'teacher',
  STUDENT: 'student'
};

// Remove the problematic findById method - Mongoose provides this by default

userSchema.statics.findByUsername = async function(username) {
  return this.findOne({ username });
};

userSchema.statics.comparePasswords = async function(candidatePassword, hashedPassword) {
  return bcrypt.compare(candidatePassword, hashedPassword);
};

userSchema.statics.changeRole = async function(id, newRole, requesterRole) {
  if (requesterRole !== this.ROLES.ADMIN) {
    throw new Error('Unauthorized');
  }

  if (!Object.values(this.ROLES).includes(newRole)) {
    throw new Error('Invalid role');
  }

  return this.findByIdAndUpdate(
    id,
    { role: newRole },
    { new: true }
  );
};

// Add course to user's courses
userSchema.statics.addCourse = async function(userId, courseId, session = null) {
  const options = { new: true };
  if (session) options.session = session;
  
  return this.findByIdAndUpdate(
    userId,
    { $addToSet: { courses: courseId } }, // $addToSet prevents duplicates
    options
  );
};

const User = mongoose.model('User', userSchema);

module.exports = User;