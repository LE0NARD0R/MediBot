const mongoose = require('mongoose');

const convSchema = new mongoose.Schema({
  name: String,
  number: String,
  role: [String],
  content: [String],  
  file: {
    data: Buffer,
    contentType: String,
  },
  uploadTime: {
    type: Date,
    default: Date.now,
  },
})



module.exports = mongoose.model('conv', convSchema);