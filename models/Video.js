const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true }, // عنوان الفيديو
  videoPath: { type: String, required: true }, // مسار الفيديو
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  order: { type: Number, required: false }, // ترتيب الفيديو داخل الكورس
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
