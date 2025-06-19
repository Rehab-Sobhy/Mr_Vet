const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const path = require('path');

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

// Route لخدمة ملفات PDF مباشرة
router.get('/pdf/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads/pdfs', req.params.filename);
  console.log('Requested file path:', filePath);
  res.setHeader('Content-Type', 'application/pdf');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ Error serving PDF:', err);
      res.status(404).send('File not found');
    }
  });
});

module.exports = router;