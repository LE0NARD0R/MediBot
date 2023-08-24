const mongoose = require('mongoose');

const convSchema = new mongoose.Schema({
  name: String,
  number: String,
  role: [String],
  content: [String],  
})



module.exports = mongoose.model('conv', convSchema);