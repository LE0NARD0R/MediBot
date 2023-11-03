const mongoose = require("mongoose");

const medicSchema = mongoose.Schema({
  name: String,
  code: Number,
  patients: [String],
  specialty: String, 
});

module.exports = mongoose.model("medic", medicSchema);
