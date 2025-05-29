const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ إضافة اشتراك جديد
router.post('/subscribe', authMiddleware, subscriptionController.subscribe);

// ✅ إلغاء الاشتراك
router.post('/unsubscribe', authMiddleware, subscriptionController.unsubscribe);

// ✅ جلب اشتراكات المستخدم الحالي
router.get('/my', authMiddleware, subscriptionController.getUserSubscriptions);

// ✅ التحقق من الاشتراك في كورس معين
router.get('/check/:courseId', authMiddleware, subscriptionController.checkSubscription);

// ✅ جلب كل الاشتراكات (للأدمن)
router.get('/', authMiddleware, subscriptionController.getAllSubscriptions);

module.exports = router;