// src/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  payerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // or whatever your user collection is
    required: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  method: {
    type: String,
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course', // your course collection
  },
}, {
  timestamps: true, // creates createdAt and updatedAt fields
});

module.exports = mongoose.model('Payment', paymentSchema);
