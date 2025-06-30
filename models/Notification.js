const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // المستخدم المرتبط بالإشعار
  title: { type: String, required: true }, // عنوان الإشعار
  message: { type: String, required: true }, // نص الإشعار
  read: { type: Boolean, default: false }, // حالة الإشعار (مقروء أم لا)
  createdAt: { type: Date, default: Date.now }, // تاريخ إنشاء الإشعار
  // إضافة نوع الإشعار (اختياري: عام/خاص/سيستم)
  type: { type: String, enum: ['system', 'user', 'general'], default: 'user' },
  // إضافة بيانات إضافية (اختياري)
  meta: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
