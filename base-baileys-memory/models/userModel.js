const mongoose = require('mongoose');

const convSchema = new mongoose.Schema({
  name: String,
  number: String,
  age: String,
  doctor: String,
  role: [String],
  content: [String],  
  image: [String],
  uploadImage: [String],
  docs: [String],
  uploadDocs: [String],
  uploadTime: {
    type: Date,
    default: Date.now,
  },
})


module.exports = mongoose.model('conv', convSchema);