const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'instructor', 'student'], // الأدوار المتاحة
    default: 'student', // الدور الافتراضي هو طالب
  },
  profileImage: { type: String }, // مسار صورة الملف الشخصي
  collegeId: {
    type: String,
    required: function () {
      return this.role === 'student'; // مطلوب فقط إذا كان الدور هو طالب
    },
  },
  activeToken: { type: String }, // تخزين التوكن النشط لمنع تسجيل الدخول من أكثر من جهاز
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }], // قائمة الكورسات المشترك فيها
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
