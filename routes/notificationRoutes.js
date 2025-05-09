const express = require('express');
const router = express.Router();
const { createNotification, getUserNotifications } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ إنشاء إشعار جديد
router.post('/', authMiddleware, createNotification);

// ✅ جلب الإشعارات الخاصة بمستخدم معين
router.get('/:userId', authMiddleware, getUserNotifications);

module.exports = router;