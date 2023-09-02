const mongoose = require('mongoose');

const convSchema = new mongoose.Schema({
  name: String,
  number: String,
  role: [String],
  content: [String],  
  image: [String],
  docs: [String],
  uploadTime: {
    type: Date,
    default: Date.now,
  },
})



module.exports = mongoose.model('conv', convSchema);