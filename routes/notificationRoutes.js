const express = require('express');
const router = express.Router();
const { createNotification, getUserNotifications, markNotificationAsRead } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ إنشاء إشعار جديد
router.post('/', authMiddleware, createNotification);

// ✅ جلب الإشعارات الخاصة بمستخدم معين
router.get('/:userId', authMiddleware, getUserNotifications);

// ✅ تحديث حالة الإشعار (تمت قراءته)
router.put('/:id/read', authMiddleware, markNotificationAsRead);

module.exports = router;