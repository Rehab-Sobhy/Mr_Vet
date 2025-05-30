const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ إنشاء إشعار جديد
router.post('/', authMiddleware, notificationController.createNotification);

// ✅ جلب الإشعارات الخاصة بمستخدم معين
router.get('/:userId', authMiddleware, notificationController.getUserNotifications);

// ✅ تحديث حالة الإشعار (تمت قراءته)
router.put('/:id/read', authMiddleware, notificationController.markNotificationAsRead);

// ✅ وضع علامة "مقروء" على إشعار معين
router.post('/mark-as-read', authMiddleware, notificationController.markAsRead);

// ✅ وضع علامة "مقروء" على جميع الإشعارات
router.post('/mark-all-as-read', authMiddleware, notificationController.markAllAsRead);

module.exports = router;