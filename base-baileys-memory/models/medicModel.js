const mongoose = require("mongoose");

const medicSchema = mongoose.Schema({
  name: String,
  code: Number,
  patients: [String],
  especiality: String, 
  asking: [String],
  asked: [String]
});

module.exports = mongoose.model("medic", medicSchema);
