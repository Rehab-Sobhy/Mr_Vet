const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true }, // عنوان الفيديو
  videoPath: { type: String, required: true }, // مسار الفيديو
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  course: { type: String, required: false }, // الكورس المرتبط
  order: { type: Number, required: false }, // ترتيب الفيديو داخل الكورس
});

module.exports = mongoose.model('Video', videoSchema);
