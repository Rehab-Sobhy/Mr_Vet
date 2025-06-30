const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  profileImage: { type: String, default: null }, // صورة المعلم (اختياري)
  collegeId: {
    type: String,
    required: function () {
      return this.role === 'student'; // مطلوب فقط إذا كان الدور هو طالب
    },
  },
  activeToken: { type: String }, // تخزين التوكن النشط لمنع تسجيل الدخول من أكثر من جهاز
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }], // قائمة الكورسات المشترك فيها
  resetPasswordToken: { type: String },      // لإعادة تعيين كلمة السر
  resetPasswordExpire: { type: Date },       // تاريخ انتهاء صلاحية التوكن
  phone: { type: String, required: true },
  carnetStatus: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  academicYear: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
