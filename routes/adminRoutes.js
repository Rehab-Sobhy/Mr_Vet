const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Course = require('../models/Course');
const sendEmail = require('../utils/sendEmail'); // استدعاء وظيفة إرسال البريد الإلكتروني
const upload = require('../middleware/uploadMiddleware'); // استدعاء Middleware رفع الملفات
const checkAdmin = require('../middleware/checkAdmin');


// ✅ عرض كل المستخدمين
router.get('/users', checkAdmin, adminController.getAllUsers);

// ✅ تعديل بيانات مستخدم
router.put('/users/:id', checkAdmin, adminController.updateUser);

// ✅ حذف مستخدم
router.delete('/users/:id', checkAdmin, adminController.deleteUser);

// ✅ تفعيل الكورس للطالب
router.post('/subscriptions/activate', checkAdmin, adminController.activateSubscription);

// ✅ رفع الملفات (صور أو فيديوهات)
router.post(
  '/upload',
  checkAdmin,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 }, // صورة مصغرة
    { name: 'video', maxCount: 1 }, // فيديو
  ]),
  adminController.uploadFile
);

// ✅ جلب إحصائيات عامة للوحة تحكم الأدمن
router.get('/stats', checkAdmin, adminController.getStats);

// ✅ إنشاء حساب معلم (أدمن فقط)
router.post('/create-teacher', checkAdmin, upload.fields([{ name: 'profileImage', maxCount: 1 }]), adminController.createTeacher);

// ✅ اعتماد الكارنيه (أدمن فقط)
router.post('/approve-carnet', checkAdmin, require('../controllers/authController').approveCarnet);

// ✅ رفض الكارنيه (أدمن فقط)
router.post('/reject-carnet', checkAdmin, require('../controllers/authController').rejectCarnet);

// إدارة الاشتراكات
router.get('/subscriptions', checkAdmin, adminController.getAllSubscriptions);
router.post('/subscriptions', checkAdmin, adminController.addSubscription);
router.delete('/subscriptions/:id', checkAdmin, adminController.deleteSubscription);

// سجل النشاطات الإدارية
router.get('/logs', checkAdmin, adminController.getAdminLogs);

// تعديل/حذف الكورسات (أدمن فقط)
router.put('/courses/:id', checkAdmin, adminController.updateCourseByAdmin);
router.delete('/courses/:id', checkAdmin, adminController.deleteCourseByAdmin);

module.exports = router;