const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const materialController = require('../controllers/materialController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// ✅ رفع ملف PDF/ZIP
router.post(
  '/:courseId',
  authMiddleware,
  roleMiddleware(['admin', 'instructor']),
  upload.single('file'),
  materialController.uploadMaterial
);

// ✅ عرض الملفات المرتبطة بكورس معين
router.get('/:courseId', materialController.getMaterials);

// ❌ حذف مادة
router.delete(
  '/:materialId',
  authMiddleware,
  roleMiddleware(['admin', 'instructor']),
  materialController.deleteMaterial
);

module.exports = router;