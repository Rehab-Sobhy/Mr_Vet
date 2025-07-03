const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  sectionType: { type: String, enum: ['Theory', 'Practical'], required: true },
  sectionTitle: { type: String, required: true },
  videos: [{ title: String, videoUrl: String }]
});

const courseSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  price: { type: Number, default: 0 },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  instructorName: { type: String, required: true },
  coverImage: { type: String },
  academicYear: { type: Number, required: true },
  category: { type: String, enum: ['general', 'credit'], required: true }, // عام أو برامج
  sections: [sectionSchema]
});

module.exports = mongoose.model('Course', courseSchema);
