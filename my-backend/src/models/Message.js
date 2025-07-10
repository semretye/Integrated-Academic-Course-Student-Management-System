const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // or 'Student' if only students send messages
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor', // or 'Admin' or 'User' depending on your app
    required: true
  },
  subject: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Message', messageSchema);
