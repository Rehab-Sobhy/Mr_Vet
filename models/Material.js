const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  filePath: { type: String, required: true },
  fileType: { type: String, required: true },
  title: { type: String },
  description: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Material', materialSchema);