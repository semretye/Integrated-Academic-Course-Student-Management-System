const mongoose = require('mongoose');
const instructorSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },  // hashed
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  bio: { type: String },
  isHead: { type: Boolean, default: false },
  role: { type: String, default: 'teacher' },  // <-- added role field default teacher
  documentPath: { type: String }, // path to uploaded doc
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Instructor', instructorSchema);