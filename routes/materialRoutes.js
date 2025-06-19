const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// رفع ملف
router.post(
  '/:courseId',
  authMiddleware,
  roleMiddleware(['admin', 'instructor']),
  upload.single('file'),
  materialController.uploadMaterial
);

// جلب المواد الخاصة بكورس
router.get('/:courseId', authMiddleware, materialController.getMaterials);

// حذف مادة
router.delete(
  '/:materialId',
  authMiddleware,
  roleMiddleware(['admin', 'instructor']),
  materialController.deleteMaterial
);

module.exports = router;