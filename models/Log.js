const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // الأدمن المنفذ
  action: { type: String, required: true }, // نوع العملية
  details: { type: Object }, // تفاصيل إضافية (اختياري)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);
