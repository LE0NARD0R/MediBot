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

const medicSchema = mongoose.Schema({
  name: String, 
  code: Number, 
  patients: [String]
})

const conv = mongoose.model( 'conv', convSchema);
const medic = mongoose.model( 'medic', medicSchema);

module.exports = {conv, medic}