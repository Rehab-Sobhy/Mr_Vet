const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// ✅ جلب الإعدادات
router.get('/', settingsController.getSettings);

// ✅ تعديل الإعدادات
router.put('/', authMiddleware, roleMiddleware(['admin']), settingsController.updateSettings);

module.exports = router;